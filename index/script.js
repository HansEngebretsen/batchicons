const iconList = document.getElementById('icon-list');
const searchInput = document.getElementById('search-index-input');
const counter = document.getElementById('index-counter');
let allIcons = [];

fetch('/manifest.json')
    .then(response => response.json())
    .then(data => {
        allIcons = data;
        displayIcons(allIcons);
    });

function displayIcons(icons) {
    iconList.innerHTML = '';
    counter.textContent = `${icons.length} / ${allIcons.length} icons showing`;
    icons.forEach(icon => {
        const listItem = document.createElement('div');
        listItem.classList.add('icon-item');
        
        const tagsString = Array.isArray(icon.tags) ? icon.tags.join(', ') : 'No tags';

        listItem.innerHTML = `
            <span class="icon-name">${icon.name}</span>
            <span class="icon-tags">${tagsString}</span>
        `;
        iconList.appendChild(listItem);
    });
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredIcons = allIcons.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm) || 
        (icon.tags && icon.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
    displayIcons(filteredIcons);
});
