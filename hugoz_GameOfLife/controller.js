//controller

var Controller = function(board, boardHeight, boardWidth){
	var that = Object.create(Controller.prototype);

	var model = new Model(boardHeight,boardWidth);
	that.model = model;
	that.board = board;

	//function to flip color of cell on click
	that.flipColor = function (cell, x,y){
		cell.flip();
		that.model.flip(x,y);

	}

	//method called for every iteration of the Game
	that.start = function(){
		var subscribers = that.model.subscribe();
		that.board.update(subscribers[0]());
	}

	//updates the model based on direct user actions with the board
	that.updateModel= function(row, column){
		that.model.cellData[row][column] = !that.model.cellData[row][column];
	}

	//updates model to reflect clearing the board
	that.clear = function(){
		that.model.cellData.forEach(function(row, rowIndex, data){
			row.forEach(function(isAlive, column, array){
				if(isAlive){
					that.model.flip(rowIndex, column);
				}
			})
		});
	};

	//updates model to reflect preset startstates
	that.startState = function(selectedValue){
		if(selectedValue==="criss cross"){
			var start = 0;
			var end = model.width-1;
			that.model.cellData.forEach(function(row, index, data){
				row[start]=true;
				row[end]=true;
				start++;
				end--;
			});
		}else if(selectedValue==="checker"){
			that.model.cellData.forEach(function(row, rowIndex, data){
				row.forEach(function(isAlive, column, array){
					if(rowIndex%2===0 && column%2===0){
						that.model.flip(rowIndex,column);
					}else if(rowIndex%2===1 && column%2===1){
						that.model.flip(rowIndex, column);
					}
				})
			});
		}else if(selectedValue==="pent"){
			that.model.cellData.forEach(function(row,rowindex,data){
				row.forEach(function(isAlive, column,array){
					if(rowindex>=8 && rowindex<=15 && column>=11 && column<=13){
						if((rowindex===9 || rowindex===14) && column===12){
							//do nothing
						}else{
							that.model.flip(rowindex,column);
						}
					}
				})
			});
		}

	}

	Object.seal(that);
	return that;
}
