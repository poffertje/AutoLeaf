angular.module('carSearch', []).controller('CarController', ['$scope', '$http', carController]);

function carController($scope, $http) {
  $scope.GraphDBSparqlEndpoint = "http://192.168.1.251:7200/repositories/Group_36";

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

  $scope.QueryManufacturers = function(){

    //Sparql query
    $scope.ManufacturersQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX auto: <http://example.com/group36/>
    select ?Manufacturer where {?Manufacturer rdf:type auto:CarManufacturer.} `;
    $scope.SparqlManufacturersQuery = encodeURI($scope.ManufacturersQuery).replace(/#/g, '%23');

    $http( {
      method: "GET",
      url : $scope.GraphDBSparqlEndpoint + "?query=" + $scope.SparqlManufacturersQuery   ,
      headers : {'Accept':'application/sparql-results+json', 'Content-Type':'application/sparql-results+json'}
    } )
    .success(function(data, status ) {
      $scope.CarManufacturers = [];
      // Iterate over the results and append the created list
      angular.forEach(data.results.bindings, function(val) {
        $scope.CarManufacturers.push(val.Manufacturer.value);
      });
      // Add the CarManufacturers to the dropdown menu
      const div = document.querySelector('.dropdown-menu');
      $scope.CarManufacturers.forEach(manufacturer => {
        div.innerHTML += `<a class="dropdown-item" href="#">${manufacturer.replace("http://example.com/group36/", "").replace('_', ' ').toLowerCase()}</a>`;
      })
    })
    .error(function(error ){
      console.log('Error running the input query!'+error);
    });
  };
};
