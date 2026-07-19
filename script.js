let distances = {};
let missingRoutes = [];


//----------------------------------------------------
// Startup
//----------------------------------------------------

window.onload = function () {

    document.getElementById("loadBtn").onclick = function () {
        document.getElementById("fileInput").click();
    };


    document.getElementById("fileInput")
        .addEventListener("change", loadLocalFile);


    if (location.protocol !== "file:") {

        loadDefaultProperties();

    }

};



//----------------------------------------------------
// Load default cities.properties
//----------------------------------------------------

async function loadDefaultProperties() {

    try {

        let response = await fetch("cities.properties");


        if (!response.ok) {

            throw new Error("Cannot load cities.properties");

        }


        let text = await response.text();


        distances = {};

        parseProperties(text);


        console.log("Default properties loaded");


    }
    catch(error) {

        console.log(error);

    }

}



//----------------------------------------------------
// Load local properties file
//----------------------------------------------------

function loadLocalFile(event) {

    let file = event.target.files[0];


    if (!file)
        return;


    let reader = new FileReader();


    reader.onload = function(e) {


        distances = {};


        parseProperties(e.target.result);


        alert(
            "Loaded routes: " +
            Object.keys(distances).length
        );


    };


    reader.readAsText(file);

}



//----------------------------------------------------
// Read properties file
//----------------------------------------------------

function parseProperties(text) {


    let lines = text.split(/\r?\n/);



    for(let line of lines) {


        line = line.trim();


        if(line === "")
            continue;


        if(line.startsWith("#"))
            continue;



        let parts = line.split("=");


        if(parts.length !== 2)
            continue;



        let key = parts[0]
            .trim()
            .replace(/ /g,"_")
            .toLowerCase();



        let value = parts[1].trim();



        if(value !== "") {

            distances[key] = Number(value);

        }

    }

}



//----------------------------------------------------
// Normalize city names
//----------------------------------------------------

function normalizeCity(city) {

    return city
        .trim()
        .replace(/ /g, "_")
        .toLowerCase();

}



//----------------------------------------------------
// Find distance
//----------------------------------------------------

function getDistance(city1, city2) {


    city1 = normalizeCity(city1);

    city2 = normalizeCity(city2);



    let forward =
        city1 + "," + city2;



    let reverse =
        city2 + "," + city1;



    if(distances[forward] != null) {

        return distances[forward];

    }



    if(distances[reverse] != null) {

        return distances[reverse];

    }



    return null;

}



//----------------------------------------------------
// Format city for properties file
//----------------------------------------------------

function formatCityForProperties(city) {

    return city
        .trim()
        .replace(/ /g, "_");

}

//----------------------------------------------------
// Calculate distances
//----------------------------------------------------

function calculate() {


    // clear old missing routes
    missingRoutes = [];


    let costPerMile =
        Number(document.getElementById("costPerMile").value);

		let feePercent = 3;


    if(isNaN(costPerMile) || costPerMile <= 0) {

        alert("Please enter valid cost per mile");

        return;

    }



    let input =
        document.getElementById("cities").value;



    if(input.trim() === "") {

        alert("Please enter cities");

        return;

    }



    let cities =
        input
        .split(",")
        .map(c => c.trim())
        .filter(c => c.length > 0);



    let html = "";



    let totalKm = 0;

    let totalMiles = 0;

    let totalCost = 0;



    //------------------------------------------------
    // Calculate routes
    //------------------------------------------------

    for(let i = 0; i < cities.length - 1; i++) {


        let from = cities[i];

        let to = cities[i + 1];



        let km =
            getDistance(from, to);



        if(km == null) {



            let missing =
                formatCityForProperties(from) +
                "," +
                formatCityForProperties(to);



            if(!missingRoutes.includes(missing)) {

                missingRoutes.push(missing);

            }



            html += `

            <div class="error">

                <b>${from} → ${to}</b>

                <br><br>

                ❌ Distance not found.

            </div>

            `;



            continue;

        }

		

        let miles =
            km / 1.61;



        let cost =
            miles * costPerMile;



        totalKm += km;

        totalMiles += miles;

        totalCost += cost;



        html += `

        <div class="route">

            <b>${from} → ${to}</b>

            <br><br>

            ${km.toFixed(2)} km

            <br>

            ${miles.toFixed(2)} miles

            <br>

            Cost : $${cost.toFixed(2)}

        </div>

        `;


    }
	
	let factoringAmount =
			    totalCost * (feePercent / 100);


			let costAfterFactoring =
			    totalCost + factoringAmount;





    //------------------------------------------------
    // Quote calculation
    //------------------------------------------------

    let quoteValue =
        document.getElementById("quote").value.trim();



    let quoteCurrency =
        document.getElementById("quoteCurrency").value;



    let quoteCAD = null;



    if(quoteValue !== "") {


        quoteCAD = Number(quoteValue);



        if(isNaN(quoteCAD)) {

            alert("Invalid quote");

            return;

        }



        if(quoteCurrency === "USD") {

            quoteCAD = quoteCAD * 1.36;

        }


    }





    //------------------------------------------------
    // Total section
    //------------------------------------------------

    html += `

    <div class="summary">


        <h3>Total</h3>


        KM :

        ${totalKm.toFixed(2)}

        <br>


        Miles :

        ${totalMiles.toFixed(2)}


        <br>


		Calculated Cost :

		$${totalCost.toFixed(2)}


		<br>


		Calculated Cost After Factoring :

		$${costAfterFactoring.toFixed(2)}

    `;



    //------------------------------------------------
    // Quote per mile comparison
    //------------------------------------------------

    if(quoteCAD != null && totalMiles > 0) {



        let quotePerMile =
            quoteCAD / totalMiles;
			
			

			let actualRatePerMile =
			    quoteCAD / totalMiles;

				let requiredRateAfterFactoring =
				    costAfterFactoring / totalMiles;


				let difference =
				    actualRatePerMile - requiredRateAfterFactoring;
					
			let differenceAmount =
			    difference * totalMiles;

        let color =
            difference < 0 ? "red" : "black";



        html += `


        <br><br>


        Quote CAD :

        $${quoteCAD.toFixed(2)}



        <br>


       

		Actual Quote Rate Per Mile :

		${actualRatePerMile.toFixed(2)}


        <br>


        <span style="color:${color}">


        Difference Per Mile :

        ${difference.toFixed(2)}
		
		<br>

		
		Difference Amount :

		$${differenceAmount.toFixed(2)}


        </span>


        `;


    }



    html += `

    </div>

    `;




    //------------------------------------------------
    // Missing routes section
    //------------------------------------------------

    if(missingRoutes.length > 0) {



        html += `


        <div class="summary">


        <h3>Add to properties file</h3>


        <pre>

`;



        for(let route of missingRoutes) {

            html += route + "=0\n";

        }



        html += `

        </pre>


        </div>


        `;


    }




    document
        .getElementById("results")
        .innerHTML = html;


}