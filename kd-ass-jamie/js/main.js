angular.module('carSearch', []).controller('CarController', ['$scope', '$http', carController]);

function carController($scope, $http) {

  $scope.filters = {
    brand: "",
    country: [],
    year: [1996, 2020],
    category:[],
    transmission: [],
    noOfDoors: [],
    vehicleStyle: [],
    fuelType: [],
    cylinders: [1, 20]
  };

  $scope.httpGet = function (theUrl) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
  };

  window.onload = () => {
    $('.brand-dropdown a').click(function () {
      const selectedClass = "dropdown-item--selected";
      $(".dropdown-item").removeClass(selectedClass);
      $scope.filters = {
        ...$scope.filters,
        brand: this.innerHTML
      };
      $('#dropdownMenuButton').text(this.innerHTML);
      if($(this).hasClass(selectedClass)) {
        $(this).removeClass(selectedClass);
      } else {
        $(this).addClass(selectedClass);
      }
    });

      $('.country-dropdown a').click(function () {
        const selectedClass = ".dropdown-item--selected";
        $(".dropdown-item").removeClass(selectedClass);
        $scope.filters = {
          ...$scope.filters,
          country: this.innerHTML
        };
        $('#countryDropdownMenuButton').text(this.innerHTML);
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

  $scope.handleFilterToggle = function (filter, value) {
    const updatedFilter = $scope.filters[filter].includes(value) ? $scope.filters[filter].filter(fil => fil !== value) : [...$scope.filters[filter], value];
    $scope.filters = {
      ...$scope.filters,
      [filter]: updatedFilter
    };

    const button = $(`#${value}`);
    const selectedClass = "button--selected";

    if(button.hasClass(selectedClass)) {
      button.removeClass(selectedClass);
    } else {
      button.addClass(selectedClass);
    }
  };


//Year range slider
  $(function () {
    $("#slider-range").slider({
      range: true,
      min: 1996,
      max: 2020,
      values: [1996, 2020],
      slide: function (event, ui) {
        $scope.filters = {
          ...$scope.filters,
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

}

const myQuery = `
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbr: <http://dbpedia.org/resource/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT COUNT(DISTINCT ?car)
WHERE {
?car rdf:type auto:Car .
?car auto:fuelType ns:${$scope.filters.transmission} . 
}
`;


$http({
  method: "GET",
  url: "http://example.com/group36/" + encodeURI(myQuery).replace(/#/g, '%23'),
  headers: {
    'Accept': 'application/sparql-results+json',
    'Content-Type': 'application/sparql-results+json'
  }
})
  .success(function (data) {
    console.log(data)  });