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
///////////////////////////////////////////////////////////////////////////////////
  angular.module('KRRclass', [ 'chart.js']).controller('MainCtrl', ['$scope','$http', mainCtrl]);

  function mainCtrl($scope, $http){
  	$scope.mySparqlEndpoint = "http://192.168.1.109:7200/repositories/Group_36";

  	$scope.startMakeQuery = function(){
  		$scope.displayMakeMessage = "Car Manufactureres";
  		//Sparql query
      $scope.myMakeQuery = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX auto: <http://example.com/group36/>
      select ?Car where {  ?Car rdf:type auto:CarManufacturer. } `;
  		$scope.mySparqlMake  = encodeURI($scope.myMakeQuery).replace(/#/g, '%23');

  		$http( {
  			method: "GET",
  			url : $scope.mySparqlEndpoint + "?query=" + $scope.mySparqlMake ,
  			headers : {'Accept':'application/sparql-results+json', 'Content-Type':'application/sparql-results+json'}
  		} )
  		.success(function(data, status ) {
  			$scope.CarManufacturers = [];
        var count = 0;
  			// now iterate on the results
  			angular.forEach(data.results.bindings, function(val) {
          count += 1;
          var ManufacturerName = val.name.value;
  				$scope.myDynamicManufacturers.push(val.Car.value);
          var name = document.createElement("dropdown-item");
  			});
  		})
  		.error(function(error ){
  			console.log('Error running the input query!'+error);
  		});
  	};

  	$scope.startQuery2 = function(){
  		$scope.myDisplayMessage2 = "This chart show the population desnity of countries ordered by their total area! (the largest countries on the left)";

  		//Second Query

  		$scope.myInputQuery2 = "PREFIX foaf: <http://xmlns.com/foaf/0.1/> PREFIX dbo: <http://dbpedia.org/ontology/> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT DISTINCT ?nameC ?density  WHERE { ?country rdf:type dbo:Country . ?country dbo:areaTotal ?area . ?country dbo:populationDensity ?density . ?country rdfs:label ?nameC FILTER (lang(?nameC) = 'en' ) }  GROUP BY (?nameC) ORDER BY DESC (?area)  LIMIT 45 ";
  		$scope.mySparqlQuery2 = encodeURI($scope.myInputQuery2).replace(/#/g, '%23');

  		$http( {
  			method: "GET",
  			url : $scope.mySparqlEndpoint + "?query=" + $scope.mySparqlQuery2,
  			headers : {'Accept':'application/sparql-results+json', 'Content-Type':'application/sparql-results+json'}
  		} )
  		.success(function(data, status ) {
  			$scope.myDynamicLabels2 = [];
  			$scope.myDynamicData2 = [];

  			// now iterate on the results
  			angular.forEach(data.results.bindings, function(val) {
  				$scope.myDynamicLabels2.push(val.nameC.value);
  				$scope.myDynamicData2.push(val.density.value);
  			});
  		})
  		.error(function(error ){
  			console.log('Error running the input query!'+error);
  		});
  	};

  }
