async function loadStores() {
  try {
    const response = await fetch('/stores.json');
    const stores = await response.json();
    const storesList = document.getElementById('storesList');
    stores.forEach(store => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${store.id}"> ${store.name}`;
      storesList.appendChild(label);
    });
  } catch (error) {
    console.error('Error loading stores:', error);
    document.getElementById('storesList').innerHTML = '<p>Error loading stores.</p>';
  }
}

async function search() {
  const query = document.getElementById('searchInput').value.trim();
  const stores = Array.from(document.querySelectorAll('.stores input:checked')).map(input => input.value);
  
  if (!query || stores.length === 0) {
    alert('Please enter a search term and select at least one store.');
    return;
  }

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = 'Loading...';

  try {
    const response = await fetch('/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, stores })
    });
    const data = await response.json();

    resultsDiv.innerHTML = '';
    if (data.items.length === 0) {
      resultsDiv.innerHTML = '<p>No results found.</p>';
      return;
    }

    data.items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'result-item';
      if (item.error) {
        div.innerHTML = `<p>${item.error}</p>`;
      } else {
        div.innerHTML = `<p><strong>${item.store}</strong>: ${item.name}</p><p>Price: ${item.price}</p><a href="${item.url}" target="_blank">View Product</a>`;
      }
      resultsDiv.appendChild(div);
    });
  } catch (error) {
    resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

window.onload = loadStores;
