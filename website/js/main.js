angular.module('carSearch', []).controller('CarController', ['$scope', '$http', carController]);

function carController($scope, $http) {
  //Insert Sparql Endpoint here -->
  $scope.GraphDBSparqlEndpoint = "http://192.168.1.251:7200/repositories/Group_36";

  //Website Filters
  $scope.filters = {
    brands: [],
    country: [],
    year: [1996, 2020],
    category:[],
    transmission: [],
    vehicleStyle: [],
    fuelType: [],
  };

  window.onload = () => {
      // Countries dropdown
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

    // Brand dropdown
    $('.brand-dropdown a').click(function () {
      const { brands } = $scope.filters;
      const selectedClass = "dropdown-item--selected";
      const updatedBrands = brands.includes(this.innerHTML) ? brands.filter(brand => brand !== this.innerHTML) : [...brands, this.innerHTML]
      $scope.filters = {
        ...$scope.filters,
        brands: updatedBrands
      };
      $('#dropdownMenuButton').text(updatedBrands.length ? updatedBrands.join(', ') : "Select brand(s)");
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


  //QUERIES


  //Query the Car Manufacturers from the triplestore
  $scope.QueryManufacturers = function(){
    //Sparql query
    $scope.ManufacturersQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX auto: <http://example.com/group36/>
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX dbr: <http://dbpedia.org/resource/>
    select ?Manufacturer where {?Manufacturer dbo:locationCountry dbr:` + $scope.filters.country.replace(' ', '_') + " .}" ;
    $scope.SparqlManufacturersQuery = encodeURI($scope.ManufacturersQuery).replace(/#/g, '%23');

    $http( {
      method: "GET",
      url : $scope.GraphDBSparqlEndpoint + "?query=" + $scope.SparqlManufacturersQuery,
      headers : {'Accept':'application/sparql-results+json', 'Content-Type':'application/sparql-results+json'}
    } )
    .success(function(data, status ) {
      $scope.CarManufacturers = [];
      // Iterate over the results and append the created list
      angular.forEach(data.results.bindings, function(val) {
        $scope.CarManufacturers.push(val.Manufacturer.value);
      });
      // Add the CarManufacturers to the dropdown menu
      class_var_1 = "dropdown-menu"
      class_var_2 = "brand-dropdown"
      const div = document.querySelector("."+class_var_1+"."+class_var_2);
      $scope.CarManufacturers.forEach(manufacturer => {
        div.innerHTML += `<a class="dropdown-item" href="#">${manufacturer.replace("http://example.com/group36/", "").replace('_', ' ').toLowerCase()}</a>`;
      })
    })
    .error(function(error ){
      console.log('Error running the input query!'+error);
    });
  };


  //
  $scope.QueryCountries = function(){
    //Sparql query
    $scope.CountriesQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX auto: <http://example.com/group36/>
    PREFIX dbo: <http://dbpedia.org/ontology/>
    select ?Country where {?Country rdf:type dbo:Country.} `;
    $scope.SparqlCountriesQuery = encodeURI($scope.CountriesQuery).replace(/#/g, '%23');

    $http( {
      method: "GET",
      url : $scope.GraphDBSparqlEndpoint + "?query=" + $scope.SparqlCountriesQuery,
      headers : {'Accept':'application/sparql-results+json', 'Content-Type':'application/sparql-results+json'}
    } )
    .success(function(data, status ) {
      $scope.Countries = [];
      // Iterate over the results and append the created list
      angular.forEach(data.results.bindings, function(val) {
        $scope.Countries.push(val.Country.value);
      });
      // Add the CarManufacturers to the dropdown menu
      class_var_1="dropdown-menu"
      class_var_2="country-dropdown"
      const div = document.querySelector("."+class_var_1+"."+class_var_2);
      $scope.Countries.forEach(country => {
        div.innerHTML += `<a class="dropdown-item" href="#">${country.replace("http://dbpedia.org/resource/", "").replace('_', ' ')}</a>`;
      })
    })
    .error(function(error ){
      console.log('Error running the input query!'+error);
    });
  };
}
