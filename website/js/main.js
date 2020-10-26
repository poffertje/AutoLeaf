angular.module('carSearch', []).controller('CarController', ['$scope', '$http', carController]);

function removeURI(URI) {
  return URI.replace("http://example.com/group36/", "").replace(/_/g, ' ').toLowerCase();
};

function carController($scope, $http) {
  //Insert Sparql Endpoint here -->
  const graphDBSparqlEndpoint = "http://192.168.1.251:7200/repositories/Group_36";

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
            ${category === "" ? "?Car rdf:type auto:Car ." : `?Car rdf:type auto:${category} .`}
            ${transmission === "" ? "?Car ns:transmission ?CarTransmission ." : `?Car ns:transmission auto:${transmission} . `}
            ?Car auto:hasFuelType ?CarFuelType .
            ${fuelType === "gasoline" ? 'FILTER (?CarFuelType != "diesel")' : fuelType === "diesel" ? "?Car auto:hasFuelType 'diesel'" : ""}
            ${driveConfig === "" ? "?Car ns:driveWheelConfiguration ?CarWheelDrive ." : `?Car ns:driveWheelConfiguration auto:${driveConfig} . `}
            ${vehicleStyle === "" ? "?Car ns:bodyStyle ?CarBodyStyle ." : `?Car ns:bodyStyle auto:${vehicleStyle} . `}

            ${category ? `BIND(auto:${category} AS ?CarCategory) .` : ""}
            ${transmission ? `BIND(auto:${transmission} AS ?CarTransmission) .` : ""}
            ${fuelType ? `BIND(auto:${fuelType} AS ?CarFuelType) . ` : ""}
            ${vehicleStyle ? `BIND(auto:${vehicleStyle} AS ?CarBodyStyle) .` : ""}
            ${driveConfig ? `BIND(auto:${driveConfig} AS ?CarWheelDrive) .` : ""}
          }
        ORDER BY (?EcoScore)
        `;

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
            resultsDiv.innerHTML += (
              `<div class="car-card">
              <img class="car-image" src="${images[brandName + formatedStyle] || images[brandName + "Other"]}" />
              <div class="car-info">
                  <h4>${name.charAt(0).toUpperCase() + name.slice(1)}</h4>
                  <div class="car-tags">
                      <span class="tag transmission-tag">Automatic</span>
                      <span class="tag fuel-tag">${car.CarFuelType.value === "diesel" ? "Diesel" : "Gasoline"}</span>
                      <span class="tag style-tag">${formatedStyle}</span>
                      <span class="tag doors-tag">${transmission.charAt(0).toUpperCase() + transmission.slice(1)}</span>
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
  acuraSedan: "https://assets.stickpng.com/images/580b585b2edbce24c47b2bff.png",
  acuraOther: "https://image.pngaaa.com/347/2400347-middle.png",
  alfaOther: 'https://www.pngkit.com/png/full/74-746062_alfa-romeo-png-file-alfa-romeo-giulietta-2018.png',
  astonOther: 'https://pngimg.com/uploads/aston_martin/aston_martin_PNG4.png',
  audiSedan: "https://w7.pngwing.com/pngs/284/602/png-transparent-audi-a3-audi-a7-car-audi-s3-audi-compact-car-sedan-car.png",
  audiOther: "https://images.carandbike.com/car-images/large/audi/q7/audi-q7.jpg?v=13",
  bentleyOther: "https://pngimg.com/uploads/bentley/bentley_PNG53.png",
  bmwWagon: "https://e7.pngegg.com/pngimages/44/784/png-clipart-bmw-3-series-gran-turismo-car-bmw-328-buick-sport-wagon-bmw-compact-car-sedan.png",
  bmwHatchback: "https://www.vhv.rs/dpng/d/204-2040563_bmw-1-series-hatchback-118i-m-sport-5dr.png",
  bmwOther: "https://www.bmw.nl/content/dam/bmw/common/all-models/x-series/x5/2019/models-and-equipment/bmw-x5-models-equipment-sd.jpg",
  bugattiOther: "https://e7.pngegg.com/pngimages/174/115/png-clipart-bugatti-chiron-geneva-motor-show-bugatti-veyron-car-bugatti-compact-car-computer-wallpaper.png",
  buickSedan: "https://www.buick.com/content/dam/buick/na/us/en/vdc-collections/2020/cars/regal-sportback/regal-sportback/regal-sportback-essence/01-images/2020-regal-sportback-mov-essence-trim.png?imwidth=960",
  buickOther: "https://img2.pngio.com/2020-buick-enclave-prices-reviews-incentives-truecar-buick-enclave-png-700_350.png",
  cadillacSedan: "https://e7.pngegg.com/pngimages/756/474/png-clipart-2014-cadillac-ats-2014-cadillac-cts-2013-cadillac-ats-car-cadillac-compact-car-sedan.png",
  cadillacOther: "https://www.cstatic-images.com/car-pictures/xl/usc90cac231b021001.png",
  chevroletSUV: "https://e7.pngegg.com/pngimages/203/212/png-clipart-2018-chevrolet-tahoe-ls-suv-sport-utility-vehicle-car-general-motors-chevrolet-driving-car.png",
  chevroletSedan: "https://e7.pngegg.com/pngimages/959/751/png-clipart-chevrolet-onix-car-chevrolet-prisma-chevrolet-cruze-chevrolet-compact-car-sedan.png",
  chevroletOther: "https://e7.pngegg.com/pngimages/925/763/png-clipart-chevrolet-sail-car-maruti-suzuki-hatchback-car-compact-car-sedan.png",
  ChryslerSedan: "https://www.cstatic-images.com/car-pictures/xl/usc60crc212b021001.png",
  ChryslerOther: "https://e7.pngegg.com/pngimages/663/45/png-clipart-car-2014-dodge-journey-2017-dodge-journey-gt-awd-suv-chrysler-journey-compact-car-car.png",
  dodgeSedan: "https://w7.pngwing.com/pngs/625/479/png-transparent-2016-dodge-charger-se-car-ram-trucks-vehicle-dodge-compact-car-sedan-car.png",
  dodgeOther: "https://e7.pngegg.com/pngimages/960/756/png-clipart-2017-dodge-journey-gt-suv-chrysler-2018-dodge-journey-sport-utility-vehicle-dodge-compact-car-canada.png",
  ferrariOther: "https://e7.pngegg.com/pngimages/474/546/png-clipart-ferrari-ferrari.png",
  fiatOther: "https://w7.pngwing.com/pngs/593/876/png-transparent-fiat-linea-fiat-punto-evo-fiat-fiorino-fiat-automobiles-fiat-compact-car-car-fiat-500.png",
  fordSedan: "https://w7.pngwing.com/pngs/655/207/png-transparent-2016-ford-focus-2017-ford-focus-titanium-sedan-car-2015-ford-focus-focus-compact-car-sedan-car.png",
  fordSUV: "https://w7.pngwing.com/pngs/20/124/png-transparent-ford-motor-company-sport-utility-vehicle-2018-ford-explorer-suv-front-wheel-drive-ford-compact-car-car-vehicle.png",
  fordOther: "https://w7.pngwing.com/pngs/459/620/png-transparent-2017-ford-focus-rs-vehicle-hatchback-price-ford-compact-car-sedan-car.png",
  genesisOther: "https://w7.pngwing.com/pngs/891/761/png-transparent-car-genesis-g80-lexus-hyundai-genesis-car-compact-car-sedan-car.png",
  gmcSUV: "https://w7.pngwing.com/pngs/759/426/png-transparent-2018-gmc-yukon-xl-denali-suv-buick-car-sport-utility-vehicle-car-compact-car-glass-car.png",
  gmcCrewCabPickUp: "https://e7.pngegg.com/pngimages/21/1013/png-clipart-2013-gmc-sierra-1500-sl-extended-cab-chevrolet-silverado-car-pickup-truck-pickup-truck-truck-automatic-transmission.png",
  gmcOther: "https://e7.pngegg.com/pngimages/464/597/png-clipart-car-2018-gmc-yukon-buick-chevrolet-car-compact-car-sedan.png",
  hondaHatchback: "https://e7.pngegg.com/pngimages/58/957/png-clipart-2016-honda-civic-car-2017-honda-civic-2018-honda-civic-honda-compact-car-sedan.png",
  hondaSUV: "https://images.honda.ca/models/H/Models/2020/cr-v/touring_10604_241modern_steel_metallic_front.png?width=1000",
  hondaOther: "https://www.honda-verhagen.nl/wp-content/themes/honda-dealer/images/models/honda-civic-sedan.png",
  hummer: "https://carsguide-res.cloudinary.com/image/upload/f_auto,fl_lossy,q_auto,t_cg_hero_low/v1/editorial/vhs/hummer-h3.png",
  hyundaiHatchback: "https://www.cstatic-images.com/car-pictures/xl/usc60hyc171a121001.png",
  hyundaiSedan: "https://www.cstatic-images.com/car-pictures/xl/usc50hyc101a021001.png",
  hyundaiOther: "https://h-static.nl/images/models/Hyundai-Kona-EV/front/default.png",
  infinitiSUV: "https://www.cstatic-images.com/car-pictures/xl/usc90ins141c021001.png",
  infinitiSedan: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2019INC25_640/2019INC250009_640_01.png",
  infinitiOther: "https://w7.pngwing.com/pngs/379/986/png-transparent-2009-infiniti-fx35-2012-infiniti-fx35-infiniti-qx70-car-car-compact-car-sedan-car.png",
  kiaSedan: "https://carsguide-res.cloudinary.com/image/upload/f_auto,fl_lossy,q_auto,t_default/v1/editorial/vhs/Kia-Optima-2019-icon.png",
  kiaOther: "https://www.kia.com/content/dam/kwcms/au/en/images/showroom/sportage/exterior360/gt-clear-white/03.png",
  lamborghiniOther: "https://www.lamborghini.com/sites/it-en/files/DAM/lamborghini/facelift_2019/homepage/families-gallery/mobile/Huracan_Evo_RWD_Spyder_cc-blu_mehit-Vanir_19_Shiny_Black-yellow_caliper-sceneplate_env.png",
  landOther: "https://www.broekhuis.nl/data/images/13382862/320_480/thu_land_rover_velar.png",
  lexusSedan: "https://www.lexus.com/cm-img/category_images/is.png",
  lexusSUV: "https://www.lexus.com/cm-img/category_images/lx.png",
  lexusOther: "https://www.lexus.com.au/-/media/lexus/main-site/nav-images/nav-dark-shadow-kraken/ct_200h_sfx_b0_3t2_caliente_v04_002.png?mw=600&q=95",
  lincolnSedan: "https://www.motortrend.com/uploads/sites/10/2017/12/2018-lincoln-continental-reserve-sedan-angular-front.png",
  lincolnSUV: "https://www.cstatic-images.com/car-pictures/xl/usc90lis042c021001.png",
  lincolnOther: "https://e7.pngegg.com/pngimages/552/98/png-clipart-2008-lincoln-mark-lt-lincoln-mark-series-car-buick-lincoln-truck-car.png",
  lotusCoupe: "https://www.motortrend.com/uploads/sites/10/2015/11/2011-lotus-exige-s260-sport-coupe-angular-front.png",
  lotusOther: "https://cdn.dealervenom.com/boardwalk-lotus/uploads/2019/11/15121943/evorahero5.png",
  maseratiCoupe: "https://www.motortrend.com/uploads/sites/10/2018/02/2018-maserati-granturismo-sport-coupe-angular-front.png",
  maseratiOther: "https://s7g10.scene7.com/is/image/maserati/maserati/international/Models/default/2021/ghibli/ghibli-front.png?$1400x2000$&fmt=png-alpha",
  maybachOther: "https://www.cstatic-images.com/car-pictures/xl/usc80mbcbx1a021001.png",
  mazdaSedan: "https://www.mazdausa.com/siteassets/vehicles/2019/mazda3-sedan/trims/sedan/2019-mazda3-sedan-basepackage-snowflakewhite-0000.png?w=360",
  mazdaSuv: "https://smartcdn.prod.postmedia.digital/driving/wp-content/uploads/2019/08/chrome-image-404436.png",
  mazdaOther: "https://www.cstatic-images.com/car-pictures/xl/usc90mac174c021001.png",
  mclarenOther: "https://cars.mclaren.com/content/dam/mclaren-automotive/configurator/hero/p14r_2d_config_landing_page_noBG_1028x449_large.png",
  mercedesSedan: "https://www.mercedes-benz.com.au/passengercars/mercedes-benz-cars/models/a-class/sedan-v177/_jcr_content/image.MQ6.2.2x.20191215234010.png",
  mercedesSUV: "https://www.mercedes-benz.ca/content/dam/mb-nafta/ca/myco/my20/glc/suv/all-vehicles/MBCAN-2020-GLC300-4M-SUV-AVP-DR.png",
  mercedesOther: "https://www.mbusa.com/content/dam/mb-nafta/us/myco/my20/gt/coupe/all-vehicles/2020-AMG-GTC-AVP-DR.png",
  mitsubishiHatchback: "https://www.mitsubishi-motors.ca/media/vehicle/nav/2020-mitsubishi-mirage-nav-large-100a5f.png",
  mitsubishiSedan: "https://e7.pngegg.com/pngimages/17/309/png-clipart-mitsubishi-motors-car-2012-mitsubishi-lancer-mitsubishi-galant-mitsubishi-compact-car-sedan.png",
  mitsubishiSUV: "https://www.mitsubishi-motors.com.au/uploads/vehicles/Eclipse_Cross/2018/cgi/eclipse-cross-exceed-front.png",
  mitsubishiOther: "https://images.wheels.ca/wp-content/uploads/2014-Mitsubishi-i-MiEV-808x455.png",
  nissanCoupe: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2012NIS002a_640/2012NIS002a_640_01.png",
  nissanSedan: "https://www.motortrend.com/uploads/sites/10/2015/11/2013-nissan-sentra-sr-cvt-sedan-angular-front.png?fit=around%7C875:492.1875",
  nissanSUV: "https://www.nbbs.nl/3.1/wp-content/uploads/2019/12/Autohuur_Amerika_Alamo-Standard-SUV.png",
  nissanOther: "https://cut-images.roadster.com/evox/color_640_032_png/13577/13577_cc640_032_KAD.png",
  oldsmobileSedan: "https://w7.pngwing.com/pngs/245/354/png-transparent-oldsmobile-442-car-oldsmobile-cutlass-oldsmobile-omega-car-sedan-convertible-car.png",
  oldsmobileOther: "https://www.cstatic-images.com/car-pictures/xl/usb40olc112c0101.png",
  plymouthOther: "https://static.wikia.nocookie.net/forzamotorsport/images/a/a5/MOT_XB1_Plymouth_GTX_FF.png/revision/latest?cb=20191201233632",
  pontiacCoupe: "https://cdn.jdpower.com/ChromeImageGallery/Expanded/Transparent/640/2009PON002b_640/2009PON002b_640_01.png",
  pontiacOther: "https://www.cstatic-images.com/car-pictures/xl/cac00poc121a0101.png",
  porscheConvertible: "https://bookluxurycar.com/listing_image/original/Porsche-911-Carrera-Cabriolet-car.png",
  porscheOther: "https://www11.porsche.com/filestore/image/multimedia/none/911-tu-modelimage-sideshot/thumbnail/1407faf5-b0a6-11ea-80ca-005056bbdc38/porsche-thumbnail.png",
  rollsOther: "https://static.tcimg.net/vehicles/primary/19f0fa88351455f3/2020-Rolls-Royce-Phantom-white-full_color-driver_side_front_quarter.png",
  saabOther: "https://www.motortrend.com/uploads/sites/10/2015/11/2010-saab-9-3-sport-sedan-fwd-aero-angular-front.png",
  scionHatchback: "https://www.motortrend.com/uploads/sites/10/2015/11/2014-scion-xd-mt-wagon-angular-front.png",
  scionOther: "https://www.cstatic-images.com/car-pictures/xl/USC40SCC031A121001.png",
  spykerOther: "https://purepng.com/public/uploads/large/purepng.com-black-spyker-c8-preliator-carcarvehicletransportspyker-961524646139bhti4.png",
  subaruSUV: "https://www.subaru.com/content/dam/subaru/vehicles/2021/ASC/vsp/landing-page/compare-models/21_ASC_MCG_031_SAL.png",
  subaruOther: "https://s3-eu-west-2.amazonaws.com/subarucore/wp-content/uploads/2019/12/12132325/BRZ-trans-resized.png",
  suzukiSedan: "https://e7.pngegg.com/pngimages/577/215/png-clipart-suzuki-swift-car-maruti-suzuki-dzire-suzuki-compact-car-sedan.png",
  suzukiSUV: "https://data.suzuki.nl/images/car/7222/DWY/LV",
  suzukiOther: "https://e7.pngegg.com/pngimages/945/578/png-clipart-suzuki-swift-compact-car-maruti-800-suzuki-swift-car-subcompact-car.png",
  teslaOther: "https://www.zakelijkelektrischleasen.nl/wp-content/uploads/2020/06/Tesla-Model-3-leasen-1-1000x664.png",
  toyotaSUV: "https://di-uploads-pod7.dealerinspire.com/toyotaofnorthmiami/uploads/2019/06/2019-Toyota-C-HR-LE-FWD-red.png",
  toyotaCoupe: "https://www.motortrend.com/uploads/sites/10/2018/02/2018-toyota-86-coupe-angular-front.png",
  toyotaSedan: "https://www.cstatic-images.com/car-pictures/xl/USC90TOC341B121001.png",
  toyotaHatchback: "https://www.cstatic-images.com/car-pictures/xl/usc90toc331b021001.png",
  toyotaOther: "https://e7.pngegg.com/pngimages/922/806/png-clipart-white-toyota-hi-ace-van-toyota-hiace-van-bus-car-bench-compact-car-driving.png",
  volkswagenHatchback: "https://www.vwimg.com/iris/iris?&vehicle=2019_AU29V2_W11_2018_09_16&paint=8P8P&fabric=BC&POV=E06,CGD&quality=90&bkgnd=TRANSPARENT&resp=PNG&X=0570&Y=2169&W=8287&H=5693&width=516",
  volkswagenSedan: "https://www.vwimg.com/iris/iris?&vehicle=2019_A332P6_0TD_UE8_WC9_2018_09_09&paint=2T2T&fabric=TB&POV=E06,CGD&quality=90&bkgnd=TRANSPARENT&resp=PNG&X=0570&Y=2169&W=8287&H=5693&width=516",
  volkswagenOther: "https://65e81151f52e248c552b-fe74cd567ea2f1228f846834bd67571e.ssl.cf1.rackcdn.com/Volkswagen%20Canada/Brochure%20Images/2018-VW-Beetle.png",
  volvoWagon: "https://www.cstatic-images.com/car-pictures/xl/cac00voc061a0101.png",
  volvoSedan: "https://crdms.images.consumerreports.org/c_lfill,w_470,q_auto,f_auto/prod/cars/cr/car-versions/13392-2019-volvo-s60-momentum",
  volvoOther: "https://i.pinimg.com/originals/e8/0b/e2/e80be2569426a723e4983f1df8e11178.png",
};
