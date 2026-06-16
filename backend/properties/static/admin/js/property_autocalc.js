document.addEventListener("DOMContentLoaded", function () {
  function autofill() {
    var price    = parseFloat(document.getElementById("id_price")?.value)     || 0;
    var numRooms = parseFloat(document.getElementById("id_num_rooms")?.value)  || 1;
    var numBeds  = parseFloat(document.getElementById("id_num_beds")?.value)   || 1;
    var roomEl   = document.getElementById("id_room_price");
    var bedEl    = document.getElementById("id_bed_price");
    if (roomEl && !roomEl.value && price > 0) {
      roomEl.value = Math.round(price / numRooms);
    }
    if (bedEl && !bedEl.value && price > 0) {
      bedEl.value = Math.round(price / numBeds);
    }
  }

  ["id_price", "id_num_rooms", "id_num_beds"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", autofill);
  });
});
