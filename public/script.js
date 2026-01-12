document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("payload");
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  });
});

function run() {
  const payload = document.getElementById("payload").value;

  fetch(`/products?category=${encodeURIComponent(payload)}`)
    .then(res => res.json())
    .then(data => {

      document.getElementById("query").innerText = data.query || "";
      const output = document.getElementById("output");
      output.innerHTML = "";

      // ERROR
      if (data.error) {
        output.innerHTML = `<div class="error">${data.error}</div>`;
        return;
      }

      // TABLE (FIXED COLUMN ORDER)
      if (data.rows) {

        const columns = [
          "id",
          "name",
          "category",
          "price",
          "description",
          "stock",
          "rating",
          "brand",
          "sku"
        ];

        let table = "<table><tr>";
        columns.forEach(c => table += `<th>${c}</th>`);
        table += "</tr>";

        data.rows.forEach(r => {
          table += "<tr>";
          columns.forEach(c => {
            table += `<td>${r[c] ?? ""}</td>`;
          });
          table += "</tr>";
        });

        table += "</table>";
        output.innerHTML = table;
      }

    });
}
