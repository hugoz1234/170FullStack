	//-------------------------------------------
	// process raw data
	//-------------------------------------------

	data = processData();
	function processData(){
			
		// order by vehicleID and secondsPastMidnight
		data.sort(function(a, b){
			return [a.vehicleId, a.secondsPastMidnight] < [b.vehicleId, b.secondsPastMidnight] ? -1 : 1;});

		// number of data records
		var length = data.length;
		
		// construct a friendlier dataset
		items = new Array();

		// loop through all data
		for(var i=0; i<length; i++){
				
			var item;			

			// check if at end of data
			if ((i+1) < length){

				// check if additional data matching vehicleId
				if (data[i].vehicleId == data[i+1].vehicleId)
				{
					// if interval is greater than 5 mins between reports
					// the data is likely from another part of the day
					var interval = data[i+1].secondsPastMidnight - data[i].secondsPastMidnight; 
					if (interval > 300){
						item = buildItem(data[i], data[i]);
					}
					else {
						item = buildItem(data[i], data[i+1]);
					}
				}
				else{
					item = buildItem(data[i], data[i]);
				}
			}
			else{
				item = buildItem(data[i], data[i]);
			}

			items.push(item);
		}
		return items;
	}

	function buildItem(current, next){
		var item = {'vehicleId':current.vehicleId,
					'latStart':current.lat,
					'lonStart':current.lon,
					'latEnd':next.lat,
					'lonEnd':next.lon,
					'timeStart':current.secondsPastMidnight,
					'timeEnd':next.secondsPastMidnight};
		return item;
	}