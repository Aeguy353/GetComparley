document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.store-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
});
function search() {
    const query = document.getElementById('searchInput').value;
    const selectedStores = Array.from(document.querySelectorAll('.store-checkbox:checked')).map(cb => cb.value);
    fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, stores: selectedStores })
    })
    .then(response => response.json())
    .then(data => {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';
        if (data.items.length === 0) {
            resultsDiv.innerHTML = '<p>No results found.</p>';
            return;
        }
        data.items.forEach(item => {
            if (item.error) {
                resultsDiv.innerHTML += `<p>Error for ${item.store}: ${item.error}</p>`;
                return;
            }
            resultsDiv.innerHTML += `
                <div>
                    <h3>${item.name}</h3>
                    <p>Store: ${item.store}</p>
                    <p>Price: ${item.price}</p>
                    <p>Shipping: ${item.shipping}</p>
                    <a href="${item.url}" target="_blank">Buy Now</a>
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" style="max-width: 100px;">` : ''}
                </div>
            `;
        });
    })
    .catch(error => {
        document.getElementById('results').innerHTML = `<p>Error: ${error.message}</p>`;
    });
}
