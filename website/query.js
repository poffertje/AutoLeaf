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
};
