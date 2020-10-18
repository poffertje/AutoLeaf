//Year range slider
$( function() {
    $( "#slider-range" ).slider({
      range: true,
      min: 1996,
      max: 2020,
      values: [ 1996, 2020 ],
      slide: function( event, ui ) {
        // This runs when the slider is moved
        $('#year1').text(ui.values[0]);
        $('#year2').text(ui.values[1]);
        $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
      }
    });
    $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
      " - $" + $( "#slider-range" ).slider( "values", 1 ) );
  } );
  
  //Cylinders slider
  $( function() {
    $( "#slider-range2" ).slider({
      range: true,
      min: 1,
      max: 20,
      values: [ 1, 20 ],
      slide: function( event, ui ) {
        // This runs when the slider is moved
        $('#cylinder1').text(ui.values[0]);
        $('#cylinder2').text(ui.values[1]);
        $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
      }
    });
    $( "#amount" ).val( "$" + $( "#slider-range2" ).slider( "values", 0 ) +
      " - $" + $( "#slider-range2" ).slider( "values", 1 ) );
  } );
  