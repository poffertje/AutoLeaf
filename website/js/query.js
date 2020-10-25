angular.module('KRRclass', []).controller('MainCtrl', ['$scope','$http', mainCtrl]);

function mainCtrl($scope, $http){
  $scope.GraphDBSparqlEndpoint = "http://192.168.1.251:7200/repositories/Group_36";

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
