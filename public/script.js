document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.store-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
});
function search() {
    const query = document.getElementById('searchInput').value;
    const selectedStores = Array.from(document.querySelectorAll('.store-checkbox:checked')).map(cb => cb.value);
    // Add search logic here, including Rakuten stores (e.g., Vevor MID 53191)
}
