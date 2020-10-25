angular.module('carSearch', []).controller('CarController', ['$scope', '$http', carController]);

function carController($scope, $http) {
  //Insert Sparql Endpoint here -->
  const graphDBSparqlEndpoint = "http://192.168.50.122:7200/repositories/kd-ass-onto";

  //Website Filters
  $scope.filters = {
    brands: [],
    country: "",
    year: [1996, 2020],
    category: [],
    transmission: [],
    vehicleStyle: [],
    fuelType: [],
    driveConfig: [],
  };

  window.onload = () => {
    // Populate the countries dropdown
    queryCountries();

    //Popover 
    $.noConflict();
    $(function () {
      $('[data-toggle="popover"]').popover();
    });
  };

  function handleCountryDropdown() {
    $('.country-dropdown a').click(function () {
      const selectedClass = "dropdown-item--selected";
      $(".dropdown-item").removeClass(selectedClass);
      $scope.filters = {
        ...$scope.filters,
        country: this.innerHTML,
        brands: []
      };
      $('#brandDropdownMenuButton').text("Select a brand");
      $('#countryDropdownMenuButton').text(this.innerHTML);
      if($(this).hasClass(selectedClass)) {
        $(this).removeClass(selectedClass);
      } else {
        $(this).addClass(selectedClass);
        queryManufacturers(this.innerHTML);
      }
    });
  }

  function handleBrandDropdown() {
    $('.brand-dropdown a').click(function () {
      const {brands} = $scope.filters;
      if(brands.length === 3 && !brands.includes(this.innerHTML)) {
        return;
      }
      const selectedClass = "dropdown-item--selected";
      const updatedBrands = brands.includes(this.innerHTML) ? brands.filter(brand => brand !== this.innerHTML) : [...brands, this.innerHTML];
      $scope.filters = {
        ...$scope.filters,
        brands: updatedBrands
      };
      $('#brandDropdownMenuButton').text(updatedBrands.length ? updatedBrands.join(', ') : "Select brand(s)");
      if($(this).hasClass(selectedClass)) {
        $(this).removeClass(selectedClass);
      } else {
        $(this).addClass(selectedClass);
      }
    });
  }

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
  function queryManufacturers(country) {
    //Sparql query
    const manufacturersQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX auto: <http://example.com/group36/>
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX dbr: <http://dbpedia.org/resource/>
    select ?Manufacturer where {?Manufacturer dbo:locationCountry dbr:` + country.replace(' ', '_') + " .}";

    $http({
      method: "GET",
      url: graphDBSparqlEndpoint + "?query=" + encodeURI(manufacturersQuery).replace(/#/g, '%23'),
      headers: {'Accept': 'application/sparql-results+json', 'Content-Type': 'application/sparql-results+json'}
    })
      .success(function (data, status) {
        // Add the CarManufacturers to the dropdown menu
        class_var_1 = "dropdown-menu";
        class_var_2 = "brand-dropdown";
        // Iterate over the results and append the created list
        const div = document.querySelector("." + class_var_1 + "." + class_var_2);
        div.innerHTML = "";
        data.results.bindings.map(val => {
          const text = val.Manufacturer.value.replace("http://example.com/group36/", "").replace('_', ' ').toLowerCase();
          div.innerHTML += `<a class="dropdown-item" href="#">${text.charAt(0).toUpperCase() + text.slice(1)}</a>`;
        });
        $(".brands-button").prop('disabled', false);
        handleBrandDropdown();
      })
      .error(function (error) {
        console.log('Error running the input query!' + error);
      });
  };


  //
  function queryCountries() {
    //Sparql query
    const countriesQuery = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX auto: <http://example.com/group36/>
    PREFIX dbo: <http://dbpedia.org/ontology/>
    select ?Country where {?Country rdf:type dbo:Country.} 
    `;

    $http({
      method: "GET",
      url: graphDBSparqlEndpoint + "?query=" + encodeURI(countriesQuery).replace(/#/g, '%23'),
      headers: {'Accept': 'application/sparql-results+json', 'Content-Type': 'application/sparql-results+json'}
    })
      .success(function (data, status) {
        // Add the CarManufacturers to the dropdown menu
        class_var_1 = "dropdown-menu";
        class_var_2 = "country-dropdown";
        const div = document.querySelector("." + class_var_1 + "." + class_var_2);
        // Iterate over the results and append the created list
        data.results.bindings.map(val => {
          div.innerHTML += `<a class="dropdown-item" href="#">${val.Country.value.replace("http://dbpedia.org/resource/", "").replace('_', ' ')}</a>`;
        });
        // Enable button now that there's options on the dropdown
        $(".country-button").prop('disabled', false);
        handleCountryDropdown();
      })
      .error(function (error) {
        console.log('Error running the input query!' + error);
      });
  };
}
