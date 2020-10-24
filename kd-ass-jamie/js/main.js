angular.module('carSearch', []).controller('CarController', ['$scope', '$http', carController]);

function carController($scope, $http) {

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
}


