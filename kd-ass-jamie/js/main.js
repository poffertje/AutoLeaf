angular.module('carSearch', []).controller('CarController', ['$scope', '$http', carController]);

function removeURI(URI) {
  return URI.replace("http://example.com/group36/", "").replace(/_/g, ' ').toLowerCase();
};

function carController($scope, $http) {
  //Insert Sparql Endpoint here -->
  const graphDBSparqlEndpoint = "http://192.168.1.103:7200/repositories/kd-ass-onto";

  //Website Filters
  let filters = {
    brands: [],
    country: "",
    category: "",
    year: [1996, 2020],
    transmission: "",
    vehicleStyle: "",
    fuelType: "",
    driveConfig: "",
  };

  window.onload = () => {
    // Populate the countries dropdown
    queryCountries();
    $.noConflict();
  };

  function handlePopover() {
    $(function () {
      $('[data-toggle="popover"]').popover();
    });
  };

  function handleCountryDropdown() {
    $('.country-dropdown a').click(function () {
      const selectedClass = "dropdown-item--selected";
      $(".dropdown-item").removeClass(selectedClass);
      filters = {
        ...filters,
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
      const {brands} = filters;
      if(brands.length === 3 && !brands.includes(this.innerHTML)) {
        return;
      }
      const selectedClass = "dropdown-item--selected";
      const updatedBrands = brands.includes(this.innerHTML) ? brands.filter(brand => brand !== this.innerHTML) : [...brands, this.innerHTML];
      filters = {
        ...filters,
        brands: updatedBrands
      };
      $('#brandDropdownMenuButton').text(updatedBrands.length ? updatedBrands.join(', ') : "Select brand(s)");
      if($(this).hasClass(selectedClass)) {
        $(this).removeClass(selectedClass);
      } else {
        $(this).addClass(selectedClass);
      }
      fetchCars();
    });
  }

  $scope.handleFilterToggle = function (filter, value) {

    const button = $(`#${value}`);
    const selectedClass = "button--selected";

    // Check if this filter is already selected
    if(filters[filter] !== "" && filters[filter] !== value) {
      $(`#${filters[filter]}`).removeClass(selectedClass);
    }

    if(filters[filter] === value) {
      button.removeClass(selectedClass);
      filters = {
        ...filters,
        [filter]: "",
      };

      fetchCars();
      return;
    }

    filters = {
      ...filters,
      [filter]: value,
    };

    button.addClass(selectedClass);
    fetchCars();
  };


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


  //QUERIES
  //Query the Countries from the triplestore
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
        const div = document.querySelector(".dropdown-menu.country-dropdown");
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
        // Iterate over the results and append the created list
        const div = document.querySelector(".dropdown-menu.brand-dropdown");
        // Remove brands from previous country
        div.innerHTML = "";
        data.results.bindings.map(val => {
          const text = removeURI(val.Manufacturer.value);
          div.innerHTML += `<a class="dropdown-item" href="#">${text.charAt(0).toUpperCase() + text.slice(1)}</a>`;
        });
        $(".brands-button").prop('disabled', false);
        handleBrandDropdown();
      })
      .error(function (error) {
        console.log('Error running the input query!' + error);
      });
  };

  function fetchCars() {
    const {brands, vehicleStyle, driveConfig, category, transmission, fuelType} = filters;
    if(!brands.length) {
      return;
    }
    const resultsDiv = document.querySelector(".results");
    resultsDiv.innerHTML = `
        <div class="pt-5 d-flex justify-content-center">
          <div class="spinner-border" role="status"></div>
        </div>
      `;

    const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX auto: <http://example.com/group36/>
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbr: <http://dbpedia.org/resource/>
        PREFIX ns: <http://www.heppnetz.de/ontologies/vso/ns#>
        SELECT distinct ?Car ?EcoScore ?CarCategory ?CarWheelDrive ?CarBodyStyle ?CarTransmission ?CarFuelType 
        WHERE { 
            ${brands.length ? `${brands.map((style, index) => `{ ?Car auto:hasManufacturer auto:${brands[index].replace(/ /g, "_").toUpperCase()} . } ${index + 1 < brands.length ? "UNION " : ""}`).join('')}` : ""}
            ?Car auto:hasEcoScore ?EcoScore .
            ${transmission === "" ? "?Car ns:transmission ?CarTransmission ." : `?Car ns:transmission auto:${transmission} . `}
            ?Car auto:hasFuelType ?CarFuelType . 
            ?Car a ?CarCategory .
            FILTER(?CarCategory = auto:LuxuryCar || ?CarCategory = auto:SpaciousCar || ?CarCategory = auto:Car)
            ${fuelType === "gasoline" ? 'FILTER (?CarFuelType != "diesel")' : fuelType === "diesel" ? 'FILTER (?CarFuelType = "diesel")' : ""}
            ${driveConfig === "" ? "?Car ns:driveWheelConfiguration ?CarWheelDrive ." : `?Car ns:driveWheelConfiguration auto:${driveConfig} . `}
            ${vehicleStyle === "" ? "?Car ns:bodyStyle ?CarBodyStyle ." : `?Car ns:bodyStyle auto:${vehicleStyle} . `}

            ${transmission ? `BIND(auto:${transmission} AS ?CarTransmission) .` : ""}
            ${vehicleStyle ? `BIND(auto:${vehicleStyle} AS ?CarBodyStyle) .` : ""}
            ${driveConfig ? `BIND(auto:${driveConfig} AS ?CarWheelDrive) .` : ""}
          } 
        ORDER BY (?EcoScore)
        `;
          console.log(query)
      $http({
      method: "GET",
      url: graphDBSparqlEndpoint + "?query=" + encodeURI(query).replace(/#/g, '%23'),
      headers: {'Accept': 'application/sparql-results+json', 'Content-Type': 'application/sparql-results+json'}
    })
      .success(function (data, status) {
        resultsDiv.innerHTML = "";
        data.results.bindings.length ?
          data.results.bindings.map(car => {
            const name = removeURI(car.Car.value).replace(/-/g, " ");
            const brandName = name.split(" ")[0];
            const carStyle = removeURI(car.CarBodyStyle.value);
            const formatedStyle = carStyle === "suv" ? "SUV" : carStyle.charAt(0).toUpperCase() + carStyle.slice(1);
            const transmission = removeURI(car.CarTransmission.value);
            const drive = removeURI(car.CarWheelDrive.value);
            const ecoScore = 100 - car.EcoScore.value;
            const ecoScoreColor = ecoScore <= 40 ? "red" : ecoScore > 40 && ecoScore <= 70 ? "orange" : "green";
            const carCategories = removeURI(car.CarCategory.value);
            resultsDiv.innerHTML += (
              `<div class="car-card">
              <img class="car-image" src="${images[brandName + formatedStyle] || images[brandName + "Other"]}" />
              <div class="car-info">
                  <h4>${(name.charAt(0) + name.slice(1)).toUpperCase()}</h4>
                  <div class="car-tags">
                      <span class="tag category-tag">${carCategories}</span>
                      <span class="tag fuel-tag">${car.CarFuelType.value === "diesel" ? "Diesel" : "Gasoline"}</span>
                      <span class="tag style-tag">${formatedStyle}</span>
                      <span class="tag transmission-tag">${transmission.charAt(0).toUpperCase() + transmission.slice(1)}</span>
                      <span class="tag drive-tag">${drive.charAt(0).toUpperCase() + drive.slice(1)}</span>
                  </div>
                  <div class="flex space-between w-100">
                      <img class="eco-leaf-image" src="img/leaf.png"/>
                      <div class="pl-2 w-100 flex-column justify-between">
                          <div class="flex">
                          <span style="font-weight: bold; margin-bottom: 3px;">Eco-friendly rating</span>
                          <span tabindex="0" class="ml-2" role="button" data-trigger="focus" data-toggle="popover" data-placement="top" data-content="Calculated as follows: Emission Score= ((Fuel Consumption Highway + Fuel Consumption City) / FuelConsumptionCombined ) * CO2 Emissions">ⓘ</span>
                      </div>
                          <div class="progress eco-progress">
                              <div class="progress-bar" role="progressbar" style="width: ${ecoScore}%; background-color: ${ecoScoreColor}" aria-valuenow="75"
                                   aria-valuemin="0" aria-valuemax="100"></div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>`
            );
            handlePopover();
          }) :
          resultsDiv.innerHTML = "<h4 class='text-center mt-3'>Sorry... no results match this search </h4>";
      })
      .error(function (error) {
        console.log('Error running the input query!' + error);
      });
  }
}


var images = {
  acuraSedan: "https://www.motortrend.com/uploads/sites/10/2017/07/2018-acura-tlx-base-sedan-angular-front.png?fit=around%7C875:492.1875",
  acuraOther: "https://cars.usnews.com/static/images/Auto/izmo/i2314360/2017_acura_rdx_angularfront.jpg",
  alfaOther: "https://postmediadriving.files.wordpress.com/2020/04/chrome-image-412076.png?w=800&h=520&crop=1",
  astonOther: "https://www.motortrend.com/uploads/sites/10/2017/05/2017-aston-martin-vanquish-base-coupe-angular-front.png?fit=around%7C875:492.1875",
  audiSedan: "https://www.motortrend.com/uploads/sites/10/2017/11/2017-audi-a4-premium-fwd-s-tronic-sedan-angular-front.png?fit=around%7C875:492.1875",
  audiOther: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2013AUD003a_640/2013AUD003a_640_01.png",
  bentleyOther: "https://www.startech.de/wp-content/uploads/2019/01/bentley-gt-tiny.png",
  bmwSUV: "https://images.carandbike.com/car-images/colors/bmw/x5/bmw-x5-mineral-white-metallic.png?v=1573040526",
  bmwHatchback: "https://imagecdn.leasingoptions.co.uk/fit-in/750x500/image/vehicles/pix_png2048/bmw/1series/3/5hatchback%20sport/bmw_20118isporthb3b_angularfront.png",
  bmwOther: "https://anijhiiaio.cloudimg.io/width/760/n/https://s3.eu-central-1.amazonaws.com/storybmw-nl/03/gelaagdtemplategroot8gc.png?v=1-0",
  bugattiOther: "https://static.wikia.nocookie.net/forzamotorsport/images/5/59/HOR_XB1_Bugatti_Veyron.png/revision/latest?cb=20190531173021",
  buickOther: "https://img2.pngio.com/2020-buick-enclave-prices-reviews-incentives-truecar-buick-enclave-png-700_350.png",
  cadillacSedan: "https://www.motortrend.com/uploads/sites/10/2016/10/2017-cadillac-ats-premium-performance-sedan-angular-front.png?fit=around%7C875:492.1875",
  cadillacOther: "https://www.cstatic-images.com/car-pictures/xl/usc90cac231b021001.png",
  chevroletSUV: "https://www.chevroletarabia.com/content/dam/chevrolet/middle-east/master/english/index/crossovers-and-suvs/2020-blazer/colourizer/2020-blazer-1rs-glu-colorizer.jpg?imwidth=960",
  chevroletSedan: "https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2020/cars/impala/colorizer/01-images/2020-impala-1lt-gaz-colorizer.jpg?imwidth=960",
  chevroletOther: "https://carasti.com/wp-content/uploads/2020/04/13066_st0640_089.png",
  chryslerSedan: "https://www.cstatic-images.com/car-pictures/xl/usc60crc212b021001.png",
  chryslerOther: "https://www.motortrend.com/uploads/sites/10/2017/04/2017-chrysler-200-limited-platinum-sedan-angular-front.png?fit=around%7C875:492.1875",
  dodgeSedan: "https://www.motortrend.com/uploads/sites/10/2015/11/2016-dodge-dart-se-sedan-angular-front.png?fit=around%7C875:492.1875",
  dodgeOther: "https://c4d709dd302a2586107d-f8305d22c3db1fdd6f8607b49e47a10c.ssl.cf1.rackcdn.com/thumbnails/stock-images/d7ff27ab82b90116dda02e928e9bed55.png",
  ferrariOther: "https://e7.pngegg.com/pngimages/474/546/png-clipart-ferrari-ferrari.png",
  fiatOther: "https://www.motortrend.com/uploads/sites/10/2015/11/2015-fiat-500-pop-3door-hatchback-angular-front.png?fit=around%7C875:492.1875",
  fordSedan: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2013FRD021a_640/2013FRD021a_640_01.png",
  fordSUV: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2020FOS37_640/2020FOS370001_640_01.png",
  fordOther: "https://cloudflarestockimages.dealereprocess.com/resrc/images/stockphoto_asset-c_limit,f_auto,fl_lossy,w_700/v1/svp/Colors_PNG1280/2014/14ford/14fordfocussehb53a/ford_14focussehb53a_angularfront_sterlinggray",
  genesisOther: "https://www.motortrend.com/uploads/sites/10/2015/11/2015-hyundai-genesis-3.8-sedan-angular-front.png?fit=around%7C875:492.1875",
  gmcSUV: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2020GMS24_640/2020GMS240001_640_01.png",
  gmcCrewCabPickUp: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2020GMT17_640/2020GMT170016_640_01.png",
  gmcOther: "https://di-uploads-pod16.dealerinspire.com/rickhendrickbuickgmcduluth/uploads/2019/02/2019-buick-regal-1.31.png",
  volkswagenSedan: "https://417i1r38i328v2pgl31uw29y-wpengine.netdna-ssl.com/files/dh/models/1012/vwjetta2019.png",
  volkswagenOther: "https://65e81151f52e248c552b-fe74cd567ea2f1228f846834bd67571e.ssl.cf1.rackcdn.com/Volkswagen%20Canada/Brochure%20Images/2018-VW-Beetle.png",
  volvoWagon: "https://www.cstatic-images.com/car-pictures/xl/cac00voc061a0101.png",
  volvoSedan: "https://crdms.images.consumerreports.org/c_lfill,w_470,q_auto,f_auto/prod/cars/cr/car-versions/13392-2019-volvo-s60-momentum",
  volvoOther: "https://www.motortrend.com/uploads/sites/10/2015/11/2013-volvo-c30-t5-m-hatchback-angular-front.png?fit=around%7C875:492.1875",
  hondaHatchback: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2018HOC020004_640/2018HOC020004_640_01.png",
  hondaSUV: "https://di-uploads-pod21.dealerinspire.com/parkerjohnstoneswilsonvillehonda/uploads/2020/01/Title.png",
  hondaOther: "https://static.tcimg.net/vehicles/primary/5fca2afe685f335b/2020-Honda-Civic-white-full_color-driver_side_front_quarter.png",
  hummer: "https://www.motortrend.com/uploads/sites/10/2015/11/2010-hummer-h3-adventure-suv-angular-front.png?fit=around%7C875:492.1875",
  hyundaiHatchback: "https://www.cstatic-images.com/car-pictures/xl/usc60hyc171a121001.png",
  hyundaiSedan: "https://www.cstatic-images.com/car-pictures/xl/usc50hyc101a021001.png",
  hyundaiOther: "https://h-static.nl/images/models/Hyundai-Nexo/pip/mobile/nexo-image-01.png",
  infinitiSUV: "https://www.cstatic-images.com/car-pictures/xl/usc90ins141c021001.png",
  infinitiSedan: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2019INC25_640/2019INC250009_640_01.png",
  infinitiOther: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2017INC270001_640/2017INC270001_640_01.png",
  kiaOther: "https://www.motortrend.com/uploads/sites/10/2018/08/2019-kia-sportage-ex-4wd-suv-angular-front.png?fit=around%7C875:492.1875",
  lamborghiniOther: "https://static.tcimg.net/vehicles/primary/c66cf2b7b6f015bb/2020-Lamborghini-Aventador-white-full_color-driver_side_front_quarter.png",
  landOther: "https://www.broekhuis.nl/data/images/13382862/320_480/thu_land_rover_velar.png",
  lexusSedan: "https://www.cstatic-images.com/car-pictures/xl/usc70lec132a021001.png",
  lexusOther: "https://www.autovoordeelwinkel.nl/Files/3/1000/1548/CategoryPhotos/1000/70560.png",
  lincolnSedan: "https://www.motortrend.com/uploads/sites/10/2017/12/2018-lincoln-continental-reserve-sedan-angular-front.png",
  lincolnSUV: "https://www.cstatic-images.com/car-pictures/xl/usc90lis042c021001.png",
  lincolnOther: "https://pictures.dealer.com/fd-DIG_IMAGES/97d97881f084b25244638ae3f73ee54d.jpg?impolicy=resize&w=640",
  lotusCoupe: "https://www.motortrend.com/uploads/sites/10/2015/11/2011-lotus-exige-s260-sport-coupe-angular-front.png",
  lotusOther: "https://cdn.dealervenom.com/boardwalk-lotus/uploads/2019/11/15121943/evorahero5.png",
  maseratiCoupe: "https://www.motortrend.com/uploads/sites/10/2018/02/2018-maserati-granturismo-sport-coupe-angular-front.png",
  maseratiOther: "https://s7g10.scene7.com/is/image/maserati/maserati/international/Models/default/2021/ghibli/ghibli-front.png?$1400x2000$&fmt=png-alpha",
  maybachOther: "https://www.cstatic-images.com/car-pictures/xl/usc80mbcbx1a021001.png",
  mazdaSedan: "https://www.mazdausa.com/siteassets/vehicles/2019/mazda3-sedan/trims/sedan/2019-mazda3-sedan-basepackage-snowflakewhite-0000.png?w=360",
  mazdaSuv: "https://smartcdn.prod.postmedia.digital/driving/wp-content/uploads/2019/08/chrome-image-404436.png",
  mazdaOther: "https://www.cstatic-images.com/car-pictures/xl/usc90mac174c021001.png",
  mclarenOther: "https://cars.mclaren.com/content/dam/mclaren-automotive/configurator/hero/p14r_2d_config_landing_page_noBG_1028x449_large.png",
  mercedesSedan: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2019MBCCC_640/2019MBCCC0001_640_01.png",
  mercedesSUV: "https://www.cstatic-images.com/car-pictures/xl/usd00mbs762a021001.png",
  mercedesOther: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2017MBC890001_640/2017MBC890001_640_01.png",
  mitsubishiHatchback: "https://crls.io/s/evox%2Fcolor_2400_032_png%2FMY2019%2F13405%2F13405_cc2400_032_A66.png/feature/n/mitsubishi-mirage.png",
  mitsubishiSedan: "https://www.motortrend.com/uploads/sites/10/2015/11/2008-mitsubishi-lancer-gts-sedan-angular-front.png?fit=around%7C875:492.1875",
  mitsubishiSUV: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2018MIS08_640/2018MIS080001_640_01.png",
  mitsubishiOther: "https://images.wheels.ca/wp-content/uploads/2014-Mitsubishi-i-MiEV-808x455.png",
  nissanCoupe: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2012NIS002a_640/2012NIS002a_640_01.png",
  nissanSedan: "https://www.motortrend.com/uploads/sites/10/2015/11/2013-nissan-sentra-sr-cvt-sedan-angular-front.png?fit=around%7C875:492.1875",
  nissanSUV: "https://www.nbbs.nl/3.1/wp-content/uploads/2019/12/Autohuur_Amerika_Alamo-Standard-SUV.png",
  nissanOther: "https://www.cstatic-images.com/car-pictures/xl/usc70nic171d021001.png",
  oldsmobileSedan: "https://w7.pngwing.com/pngs/245/354/png-transparent-oldsmobile-442-car-oldsmobile-cutlass-oldsmobile-omega-car-sedan-convertible-car.png",
  oldsmobileOther: "https://www.cstatic-images.com/car-pictures/xl/usb40olc112c0101.png",
  plymouthOther: "https://static.wikia.nocookie.net/forzamotorsport/images/a/a5/MOT_XB1_Plymouth_GTX_FF.png/revision/latest?cb=20191201233632",
  pontiacCoupe: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2009PON002b_640/2009PON002b_640_01.png",
  pontiacOther: "https://www.cstatic-images.com/car-pictures/xl/cac00poc121a0101.png",
  porscheConvertible: "https://bookluxurycar.com/listing_image/original/Porsche-911-Carrera-Cabriolet-car.png",
  porscheOther: "https://www.motortrend.com/uploads/sites/10/2015/11/2015-porsche-panamera-sedan-angular-front.png?fit=around%7C875:492.1875",
  rollsConvertible:"https://static.tcimg.net/vehicles/primary/b92e1e64ba71e1c5/2020-Rolls-Royce-Dawn-white-full_color-driver_side_front_quarter.png",
  rollsCoupe:"https://static.tcimg.net/vehicles/primary/42448d41fec6834e/2020-Rolls-Royce-Wraith-white-full_color-driver_side_front_quarter.png",
  rollsOther: "https://static.tcimg.net/vehicles/primary/19f0fa88351455f3/2020-Rolls-Royce-Phantom-white-full_color-driver_side_front_quarter.png",
  saabOther: "https://www.motortrend.com/uploads/sites/10/2015/11/2010-saab-9-3-sport-sedan-fwd-aero-angular-front.png",
  scionHatchback: "https://www.motortrend.com/uploads/sites/10/2015/11/2014-scion-xd-mt-wagon-angular-front.png",
  scionOther: "https://www.cstatic-images.com/car-pictures/xl/USC40SCC031A121001.png",
  spykerOther: "https://picolio.auto123.com/15photo/spyker/2015-spyker-c8-aileron.png",
  subaruSUV: "https://www.subaru.com/content/dam/subaru/vehicles/2021/ASC/vsp/landing-page/compare-models/21_ASC_MCG_031_SAL.png",
  subaruOther: "https://s3-eu-west-2.amazonaws.com/subarucore/wp-content/uploads/2019/12/12132325/BRZ-trans-resized.png",
  suzukiSedan: "https://www.cstatic-images.com/car-pictures/xl/usc30szc101c021001.png",
  suzukiSUV: "https://data.suzuki.nl/images/car/7222/DWY/LV",
  suzukiOther: "https://prod-suzuki.azureedge.net/media/14707/swift-szt-alloy-fr.png?anchor=center&mode=crop&width=850&rnd=132277263450000000",
  teslaOther: "https://www.zakelijkelektrischleasen.nl/wp-content/uploads/2020/06/Tesla-Model-3-leasen-1-1000x664.png",
  toyotaSUV: "https://di-uploads-pod7.dealerinspire.com/toyotaofnorthmiami/uploads/2019/06/2019-Toyota-C-HR-LE-FWD-red.png",
  toyotaCoupe: "https://www.motortrend.com/uploads/sites/10/2018/02/2018-toyota-86-coupe-angular-front.png",
  toyotaSedan: "https://www.cstatic-images.com/car-pictures/xl/USC90TOC341B121001.png",
  toyotaHatchback: "https://www.cstatic-images.com/car-pictures/xl/usc90toc331b021001.png",
  toyotaOther: "https://www.carmax.com/~/media/images/carmax/com/articles/top-10-convertibles-under-20k-of-2016/166529_08-toyota-solara-(2).png?la=en&hash=A39230100602AA096BC3592DBD4B1E82E6525577",
  volkswagenHatchback: "https://www.cstatic-images.com/car-pictures/xl/usc90vwc232c021001.png",
};