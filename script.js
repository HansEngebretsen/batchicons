const iconGrid = document.getElementById('icon-grid');
const searchInput = document.getElementById('search-input');
const footerCounter = document.getElementById('footer-counter');
const selectionBar = document.getElementById('selection-bar');
const selectionCount = document.getElementById('selection-count');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const themeToggleContainer = document.querySelector('.theme-toggle-container');
const colorPickerBtn = document.getElementById('color-picker-btn');
const colorPickerDropdown = document.getElementById('color-picker-dropdown');
const colorPickerInput = document.getElementById('color-picker-input');
const swatchContainer = document.getElementById('swatch-container');
const coolColorsContainer = document.getElementById('cool-colors-container');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsDropdown = document.getElementById('settings-dropdown');
const fillToggle = document.getElementById('fill-toggle');
const weightSlider = document.getElementById('weight-slider');
const weightValue = document.getElementById('weight-value');
const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');
const densityControl = document.getElementById('density-control');
const helpBtn = document.getElementById('help-btn');
const helpDialog = document.getElementById('help-dialog');
const closeHelpBtn = document.getElementById('close-help-btn');
const toast = document.getElementById('toast');

let completeIconList = [];
let outlinedIcons = [];
let filledIcons = [];
let allIcons = []; // This will be the active list (either outlined or filled)
let displayedIcons = [];
let selectedIcons = new Set();
let lazyLoadObserver;
const ICONS_PER_PAGE = 100;
let currentPage = 0;
let lastClickedIconName = null;

// --- Settings & Colors ---
let currentStyle = 'outlined'; // Default to outlined
let currentWeight = '400';
let currentSize = '48'; // Default size updated to 48px

const COOL_COLORS = ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#f1c40f', '#e67e22', '#e74c3c'];
const defaultLightColor = '#2a4365';
const defaultDarkColor = '#a8b2d1';
let colorSwatches = JSON.parse(localStorage.getItem('colorSwatches')) || [defaultLightColor, defaultDarkColor];
let activeColor = colorSwatches[0];

function renderColorPicker() {
    colorPickerBtn.style.backgroundColor = activeColor;
    swatchContainer.innerHTML = '';
    colorSwatches.forEach(color => {
        const swatch = createSwatch(color, () => {
            activeColor = color;
            applyColors();
            renderColorPicker();
        });
        if (color === activeColor) swatch.classList.add('selected');
        swatchContainer.appendChild(swatch);
    });
    coolColorsContainer.innerHTML = '';
    COOL_COLORS.forEach(color => {
        const swatch = createSwatch(color, () => {
            if (!colorSwatches.includes(color)) {
                colorSwatches.push(color);
                localStorage.setItem('colorSwatches', JSON.stringify(colorSwatches));
            }
            activeColor = color;
            applyColors();
            renderColorPicker();
        });
        if (color === activeColor) swatch.classList.add('selected');
        coolColorsContainer.appendChild(swatch);
    });
}

function createSwatch(color, onClick) {
    const swatch = document.createElement('div');
    swatch.classList.add('color-swatch');
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', onClick);
    return swatch;
}

// --- Event Listeners ---

colorPickerInput.addEventListener('change', (e) => {
    const newColor = e.target.value;
    if (!colorSwatches.includes(newColor)) colorSwatches.push(newColor);
    localStorage.setItem('colorSwatches', JSON.stringify(colorSwatches));
    activeColor = newColor;
    applyColors();
    renderColorPicker();
});

clearHistoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    colorSwatches = [defaultLightColor, defaultDarkColor];
    localStorage.setItem('colorSwatches', JSON.stringify(colorSwatches));
    activeColor = document.body.classList.contains('dark-mode') ? defaultDarkColor : defaultLightColor;
    renderColorPicker();
    applyColors();
});

colorPickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.remove('visible');
    colorPickerDropdown.classList.toggle('visible');
});

settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    colorPickerDropdown.classList.remove('visible');
    settingsDropdown.classList.toggle('visible');
});

document.addEventListener('click', (e) => {
    if (!colorPickerDropdown.contains(e.target) && e.target !== colorPickerBtn) {
        colorPickerDropdown.classList.remove('visible');
    }
    if (!settingsDropdown.contains(e.target) && e.target !== settingsBtn) {
        settingsDropdown.classList.remove('visible');
    }
});

fillToggle.addEventListener('change', (e) => {
    const isFilled = e.target.checked;
    currentStyle = isFilled ? 'rounded' : 'outlined';
    allIcons = isFilled ? filledIcons : outlinedIcons;

    performSearch(searchInput.value);
    updateUrl();
});

densityControl.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const density = e.target.dataset.density;
        iconGrid.classList.remove('density-comfortable', 'density-cozy', 'density-compact');
        iconGrid.classList.add(`density-${density}`);

        densityControl.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    }
});

weightSlider.addEventListener('input', (e) => {
    currentWeight = e.target.value;
    weightValue.textContent = currentWeight;
});
weightSlider.addEventListener('change', () => displayIcons(displayedIcons));

sizeSlider.addEventListener('input', (e) => {
    currentSize = e.target.value;
    sizeValue.textContent = `${currentSize}px`;
    iconGrid.querySelectorAll('.icon-container svg').forEach(svg => {
        svg.style.width = `${currentSize}px`;
        svg.style.height = `${currentSize}px`;
    });
});

themeToggleContainer.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const wasLightDefault = activeColor === defaultLightColor;
    const wasDarkDefault = activeColor === defaultDarkColor;

    // Only switch to the new theme's default color if the active color
    // was one of the old theme's default colors.
    if (wasLightDefault || wasDarkDefault) {
        activeColor = isDarkMode ? defaultDarkColor : defaultLightColor;
    }
    
    renderColorPicker();
    applyColors();
});

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
const debouncedUpdateUrl = debounce(updateUrl, 1000);
const clearSearchBtn = document.getElementById('clear-search-btn');

searchInput.addEventListener('input', () => {
    performSearch(searchInput.value);
    debouncedUpdateUrl();
    if (searchInput.value.length > 0) {
        searchInput.parentElement.classList.add('has-text');
    } else {
        searchInput.parentElement.classList.remove('has-text');
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    performSearch('');
    searchInput.parentElement.classList.remove('has-text');
    searchInput.focus();
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const firstIcon = iconGrid.querySelector('.icon-container');
        if (firstIcon) {
            firstIcon.focus();
        }
    }
});

iconGrid.addEventListener('keydown', (e) => {
    const activeElement = document.activeElement;
    if (!activeElement.classList.contains('icon-container')) return;

    let newIndex;
    const currentIndex = Array.from(iconGrid.children).indexOf(activeElement);
    const itemsPerRow = Math.floor(iconGrid.clientWidth / activeElement.offsetWidth);

    switch (e.key) {
        case 'ArrowRight':
            newIndex = currentIndex + 1;
            break;
        case 'ArrowLeft':
            newIndex = currentIndex - 1;
            break;
        case 'ArrowDown':
            newIndex = currentIndex + itemsPerRow;
            break;
        case 'ArrowUp':
            newIndex = currentIndex - itemsPerRow;
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            toggleIconSelection(activeElement.dataset.iconName, activeElement);
            return;
        default:
            return;
    }

    if (newIndex >= 0 && newIndex < iconGrid.children.length) {
        iconGrid.children[newIndex].focus();
    }
});

deselectAllBtn.addEventListener('click', deselectAllIcons);


helpBtn.addEventListener('click', () => {
    helpDialog.classList.add('visible');
});

closeHelpBtn.addEventListener('click', () => {
    helpDialog.classList.remove('visible');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'd' && selectedIcons.size > 0) {
        downloadBtn.click();
    }
    if (e.key === 'c' && selectedIcons.size > 0) {
        copyBtn.click();
    }
    if (e.key === 'Escape') {
        if (selectedIcons.size > 0) {
            deselectAllIcons();
        } else if (helpDialog.classList.contains('visible')) {
            helpDialog.classList.remove('visible');
        } else {
            searchInput.blur();
        }
    }
    if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
});

// --- SVG & Data Handling ---

function applyColors() {
    iconGrid.querySelectorAll('.icon-container svg').forEach(svg => {
        svg.style.fill = activeColor;
    });
}

function processSvgContent(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "image/svg+xml");
    const svgElement = doc.documentElement;
    svgElement.setAttribute('fill', activeColor);
    return new XMLSerializer().serializeToString(svgElement);
}

async function getIconData(iconName, weight, style) {
    let res = await fetch(`processed-icons/${weight}/${style}/${iconName}.json`);
    if (!res.ok) {
        res = await fetch(`processed-icons/400/${style}/${iconName}.json`);
    }
    if (!res.ok) {
        return null;
    }
    return res.json();
}

// --- Action Buttons ---

downloadBtn.addEventListener('click', async () => {
    if (selectedIcons.size === 1) {
        const iconName = selectedIcons.values().next().value;
        const icon = await getIconData(iconName, currentWeight, currentStyle);
        const coloredSvg = processSvgContent(icon.content);
        const blob = new Blob([coloredSvg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${icon.name}.svg`;
        link.click();
    } else if (selectedIcons.size > 1) {
        const zip = new JSZip();
        const promises = Array.from(selectedIcons).map(async iconName => {
            const icon = await getIconData(iconName, currentWeight, currentStyle);
            zip.file(`${icon.name}.svg`, processSvgContent(icon.content));
        });
        await Promise.all(promises);
        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'material-icons.zip';
            link.click();
        });
    }
});

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

copyBtn.addEventListener('click', async () => {
    const promises = Array.from(selectedIcons).map(async iconName => {
        const icon = await getIconData(iconName, currentWeight, currentStyle);
        return processSvgContent(icon.content);
    });
    const results = await Promise.all(promises);
    navigator.clipboard.writeText(results.join('\n')).then(() => {
        showToast('Copied SVGs!');
    });
});

// --- Core Display & Selection Logic ---

function displayIcons(icons) {
    iconGrid.innerHTML = '';
    displayedIcons = icons;
    currentPage = 0;
    updateFooterCounter();
    loadMoreIcons();
}

function loadMoreIcons() {
    const start = currentPage * ICONS_PER_PAGE;
    const end = start + ICONS_PER_PAGE;
    const iconsToLoad = displayedIcons.slice(start, end);

    if (iconsToLoad.length === 0 && currentPage > 0) {
        if (lazyLoadObserver) lazyLoadObserver.disconnect();
        return;
    }

    iconsToLoad.forEach(icon => {
        const iconName = icon.name;
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('icon-container');
        iconContainer.dataset.iconName = iconName;
        iconContainer.tabIndex = 0;
        
        iconContainer.innerHTML = `<p>${iconName.replace(/_/g, ' ')}</p>`;

        getIconData(iconName, currentWeight, currentStyle).then(iconData => {
            if (iconData) {
                iconContainer.innerHTML = `${iconData.content}<p>${iconData.name}</p>`;
                const svg = iconContainer.querySelector('svg');
                if (svg) {
                    svg.style.width = `${currentSize}px`;
                    svg.style.height = `${currentSize}px`;
                    svg.style.fill = activeColor;
                }
                if (selectedIcons.has(iconName)) {
                    addDeselectButton(iconContainer);
                    iconContainer.classList.add('selected');
                }
            } else {
                iconContainer.remove();
            }
        });

        iconContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('deselect-icon-btn')) return;
            if (e.shiftKey && lastClickedIconName) {
                handleShiftSelection(iconName);
            } else {
                toggleIconSelection(iconName, iconContainer);
            }
            lastClickedIconName = iconName;
        });
        iconGrid.appendChild(iconContainer);
    });
    currentPage++;
    setupLazyLoadObserver();
}

function setupLazyLoadObserver() {
    if (lazyLoadObserver) lazyLoadObserver.disconnect();
    const options = { root: null, rootMargin: '0px 0px 300px 0px', threshold: 0 };
    lazyLoadObserver = new IntersectionObserver((entries) => {
        if (entries[entries.length - 1].isIntersecting) {
            loadMoreIcons();
        }
    }, options);
    const lastIcon = iconGrid.querySelector('.icon-container:last-child');
    if (lastIcon) {
        lazyLoadObserver.observe(lastIcon);
    }
}

function performSearch(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    let filteredIcons = [];
    if (searchTerm.includes(',')) {
        const searchTerms = searchTerm.split(',').map(t => t.trim().replace(/ /g, '_')).filter(Boolean);
        if (searchTerms.length > 0) {
            filteredIcons = allIcons.filter(icon => 
                searchTerms.some(term => 
                    icon.name.toLowerCase().includes(term) ||
                    (icon.tags && icon.tags.some(tag => tag.toLowerCase().includes(term)))
                )
            );
        } else {
            filteredIcons = allIcons;
        }
    } else {
        filteredIcons = allIcons.filter(icon => 
            icon.name.toLowerCase().includes(searchTerm) || 
            (icon.tags && icon.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    displayIcons(filteredIcons);
}

function updateUrl() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const newUrl = searchTerm 
        ? `${window.location.pathname}?search=${encodeURIComponent(searchTerm)}`
        : window.location.pathname;
    history.pushState({ searchTerm }, '', newUrl);
}

function handleShiftSelection(currentIconName) {
    const lastIndex = displayedIcons.findIndex(i => i.name === lastClickedIconName);
    const currentIndex = displayedIcons.findIndex(i => i.name === currentIconName);
    if (lastIndex === -1 || currentIndex === -1) return;
    const start = Math.min(lastIndex, currentIndex);
    const end = Math.max(lastIndex, currentIndex);
    const rangeToSelect = displayedIcons.slice(start, end + 1);
    rangeToSelect.forEach(iconInRange => {
        if (!selectedIcons.has(iconInRange.name)) {
            selectedIcons.add(iconInRange.name);
            const el = iconGrid.querySelector(`[data-icon-name="${iconInRange.name}"]`);
            if (el) {
                el.classList.add('selected');
                addDeselectButton(el);
            }
        }
    });
    updateSelectionBar(true);
}

function addDeselectButton(container) {
    const btn = document.createElement('button');
    btn.className = 'deselect-icon-btn';
    btn.innerHTML = '&times;';
    btn.onclick = (e) => {
        e.stopPropagation();
        toggleIconSelection(container.dataset.iconName, container);
    };
    container.appendChild(btn);
}

function toggleIconSelection(iconName, container) {
    const wasSelected = selectedIcons.has(iconName);
    if (wasSelected) {
        selectedIcons.delete(iconName);
        container.classList.remove('selected');
        const btn = container.querySelector('.deselect-icon-btn');
        if (btn) btn.remove();
    } else {
        selectedIcons.add(iconName);
        container.classList.add('selected');
        addDeselectButton(container);
    }
    updateSelectionBar(!wasSelected);
}

function deselectAllIcons() {
    selectedIcons.clear();
    document.querySelectorAll('.icon-container.selected').forEach(container => {
        container.classList.remove('selected');
        const btn = container.querySelector('.deselect-icon-btn');
        if (btn) btn.remove();
    });
    updateSelectionBar(false);
}

function updateSelectionBar(isCountingUp) {
    const count = selectedIcons.size;
    const oldCount = parseInt(selectionCount.dataset.count || '0');
    if (count === 0) {
        selectionBar.classList.remove('visible');
        return;
    }
    if (!selectionBar.classList.contains('visible')) {
        selectionBar.classList.add('visible');
    }
    const newText = `${count} icon${count > 1 ? 's' : ''} selected`;
    if (count !== oldCount) {
        const animationClass = isCountingUp ? 'counting-up' : 'counting-down';
        selectionCount.classList.add(animationClass);
        setTimeout(() => {
            selectionCount.textContent = newText;
            selectionCount.dataset.count = count;
            selectionCount.classList.remove(animationClass);
        }, 150);
    }
}

function updateFooterCounter() {
    footerCounter.textContent = `${displayedIcons.length} / ${allIcons.length} icons`;
}

// --- Initial Load ---

function initialize() {
    if (!colorSwatches.includes(defaultLightColor)) colorSwatches.unshift(defaultLightColor);
    if (!colorSwatches.includes(defaultDarkColor)) colorSwatches.push(defaultDarkColor);
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
        activeColor = defaultDarkColor;
    } else {
        activeColor = defaultLightColor;
    }
    
    weightSlider.value = currentWeight;
    weightValue.textContent = currentWeight;
    sizeSlider.value = currentSize;
    sizeValue.textContent = `${currentSize}px`;

    renderColorPicker();
    applyColors();

    fetch('manifest.json')
        .then(response => response.json())
        .then(data => {
            completeIconList = data;
            outlinedIcons = completeIconList.filter(icon => !icon.name.endsWith('-fill'));
            filledIcons = completeIconList.filter(icon => icon.name.endsWith('-fill'));

            allIcons = outlinedIcons;
            fillToggle.checked = false;
            currentStyle = 'outlined';

            const params = new URLSearchParams(window.location.search);
            const searchTerm = params.get('search') || '';
            searchInput.value = decodeURIComponent(searchTerm);
            performSearch(searchTerm);
        });
    
    document.body.addEventListener('click', (e) => {
        if (!iconGrid.contains(e.target)) {
            lastClickedIconName = null;
        }
    }, true);

    window.addEventListener('popstate', (e) => {
        const searchTerm = (e.state && e.state.searchTerm) ? e.state.searchTerm : '';
        searchInput.value = searchTerm;
        performSearch(searchTerm);
    });

    const backToTopBtn = document.getElementById('back-to-top-btn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight * 3) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
}

initialize();