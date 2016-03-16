/*
	Hard border implementation
	Living cells represented by true, dead by false
*/
var Model = function(height,width){
	var that = Object.create(Model.prototype);

	that.height = height;
	that.width = width;

	that.cellData = [];
	that.subscribers =[];


	//initializes 2D Array, represents all the cells
	var times = function (i, f) {
		if (i === 0) return;
		f(); times (i-1, f)
	}

	times (height, function () {
  		var col = [];
		that.cellData.push (col);
		times (width, function () {
				col.push (false);
  				})
	})

	//helper method to negate the state of a cell
	that.flip = function(row, index){
		that.cellData[row][index]= !that.cellData[row][index];
	}

	/*Enforces the Game of Life rules for each iteration
		1) Any living cell with <2 living neighbors dies
		2) Any living cell with 2||3 lives
		3) Any living cell with >3 neighbors dies
		4) Any dead cell with 3 living neighbors becomes alive*/
	that.update = function(){
		//checks neighbors of cell and returns count of live neighbors
		var countNeighbors = function(row, index){
			var livingCells = 0;

			//checks block on top
			if(row!==0){
				if(that.cellData[row-1][index]){
					livingCells+=1;
				}
			}

			//check block on top left
			if(row!==0 && index!==0){
				if(that.cellData[row-1][index-1]){
					livingCells+=1;
				}
			}

			//check block on left
			if(index!==0){
				if(that.cellData[row][index-1]){
					livingCells+=1;
				}
			}

			//check block on bottom left
			if(row!==that.height-1 && index!==0){
				if(that.cellData[row+1][index-1]){
					livingCells+=1;
				}
			}

			//check block on bottom
			if(row!==that.height-1){
				if(that.cellData[row+1][index]){
					livingCells+=1;				
				}
			}

			//check block on bottom right
			if(row!==that.height-1 && index!==that.width-1){
				if(that.cellData[row+1][index+1]){
					livingCells+=1;
				}
			}

			//check block on right
			if(index!==that.width-1){
				if(that.cellData[row][index+1]){
					livingCells+=1;				
				}
			}

			//check block on top right
			if(index!==that.width-1 && row!==0){
				if(that.cellData[row-1][index+1]){
					livingCells+=1;
				}
			}
			return livingCells;			
		}

		//will enforce rules 
		var checkRules = function(cellIsAlive, livingCells){
			if(cellIsAlive && (livingCells<2 || livingCells>3)){
				return false;
			}else if(cellIsAlive && (livingCells===2 || livingCells===3)){
				return true;
			}else if(livingCells===3){
				return true;
			}

			return false;
			
		}

		var newCellData = [];

		//makes a copy of cell data 
		that.cellData.forEach(function(currentValue, index, array){
			newCellData.push(currentValue.slice());
		});

		//for each cell: updates value of cell for next iteration
		that.cellData.forEach(function (row,rowIndex,array){
			row.forEach(function (cellIsAlive,cellIndex,rowArray){
				var livingCells = countNeighbors(rowIndex,cellIndex);
				newCellData[rowIndex][cellIndex] = checkRules(cellIsAlive, livingCells);
			})
		});



		that.cellData = newCellData;

		return that.cellData;
	}

	that.subscribe = function (){
		that.subscribers = [];
		that.subscribers.push(that.update);
		return that.subscribers;
	}






	Object.seal(that);
	return that;
}