let filters = {
    brand: "",
    year: [1996, 2020],
    transmission: [],
    noOfDoors: [],
    vehicleStyle: [],
    fuelType: [],
    cylinders: [1, 20]
  };

  function httpGet(theUrl) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
  }

  window.onload = () => {
    $('.dropdown-menu a').click(function () {
      const selectedClass = "dropdown-item--selected";
      $(".dropdown-item").removeClass(selectedClass);
      filters = {
        ...filters,
        brand: this.innerHTML
      };
      $('#dropdownMenuButton').text(this.innerHTML);
      if($(this).hasClass(selectedClass)) {
        $(this).removeClass(selectedClass);
      } else {
        $(this).addClass(selectedClass);
      }
    });
    // const query = httpGet("https://api.unsplash.com/search/photos?client_id=1R7OEW7YscUFiapoATUJqdO8x-O4naIgxOM9mlxxsy8&page=3&query=ferrari");
    // const images = query.results.map(result => result.urls.full);
    // const container = document.getElementById('imageContainer');
    // images.map(image => {
    //   let img = document.createElement('img');
    //   img.src = image;
    //   img.style = "max-width: 200px;";
    //   container.appendChild(img);
    // });
  };

  function handleFilterToggle(filter, value) {
    const updatedFilter = filters[filter].includes(value) ? filters[filter].filter(fil => fil !== value) : [...filters[filter], value];
    filters = {
      ...filters,
      [filter]: updatedFilter
    };

    const button = $(`#${value}`);
    const selectedClass = "button--selected";

    if(button.hasClass(selectedClass)) {
      button.removeClass(selectedClass);
    } else {
      button.addClass(selectedClass);
    }
  }


  //Year range slider
  $(function () {
    $("#slider-range").slider({
      range: true,
      min: 1996,
      max: 2020,
      values: [1996, 2020],
      slide: function (event, ui) {
        filters = {
          ...filters,
          year: [ui.values[0], ui.values[1]]
        };
        // This runs when the slider is moved
        $('#year1').text(ui.values[0]);
        $('#year2').text(ui.values[1]);
        $("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
      }
    });
    $("#amount").val("$" + $("#slider-range").slider("values", 0) +
      " - $" + $("#slider-range").slider("values", 1));
  });

  //Cylinders slider
  $(function () {
    $("#slider-range2").slider({
      range: true,
      min: 1,
      max: 20,
      values: [1, 20],
      slide: function (event, ui) {
        filters = {
          ...filters,
          cylinders: [ui.values[0], ui.values[1]]
        };
        $('#cylinder1').text(ui.values[0]);
        $('#cylinder2').text(ui.values[1]);
        $("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
      }
    });
    $("#amount").val("$" + $("#slider-range2").slider("values", 0) +
      " - $" + $("#slider-range2").slider("values", 1));
  });
  //
