/*Board.js represents the View of Game of Life*/

var Row = function(rowNum){
	var that = Object.create(Row.prototype);

	that.div = document.createElement("div");
	that.div.setAttribute("class", "row");
	that.cells = [];

	Object.seal(that);
	return that;

}

var Cell = function(x,y){
	var that = Object.create(Cell.prototype);

	that.div = document.createElement("div");
	that.div.setAttribute("class", "deadCell");
	that.div.setAttribute("id", "cell (" +x+","+y+")");
	that.x = x;
	that.y = y;

	that.div.onclick = function(){
		that.flip();
		updateModel(that.x, that.y);
	}

	that.isAlive = false;
	that.flip = function(){
		if(that.isAlive){
			that.isAlive=false;
			that.div.className = "deadCell";
		}else{
			that.isAlive=true;
			that.div.className = "aliveCell";
		}
	}

	Object.seal(that);
	return that;
}

var Board = function(boardHeight, boardWidth){
	var that = Object.create(Board.prototype);

	that.container = document.createElement("div");
	that.container.setAttribute("id", "board");
	that.rows = [];

	/*In order to set up the board with Rows and Cells I found two nested for loops to be the best way to perform repreated
		operations since multiple function calls are made at each iteration. 
	*/
	for(var i=0; i<boardHeight; i++){
		var row = new Row(i);
		row.div.setAttribute("id", String("row"+i));

		for(var j=0;j<boardWidth;j++){
			var cell = new Cell(i,j);
			row.cells.push(cell);
			row.div.appendChild(cell.div);
		}

		that.rows.push(row);
		that.container.appendChild(row.div);

	}

	var box = document.getElementById("box");
	//for testing purposes
	if(box!==null){
		box.appendChild(that.container);
	}


	//updates the view for every iteration given new cell data
	that.update = function(newCellData){

		newCellData.forEach(function (row, rowNum, data){
			row.forEach(function (isAlive, column, array){
				if(isAlive!== that.rows[rowNum].cells[column].isAlive){
					that.rows[rowNum].cells[column].flip();
				}
			})
		});
	}

	//kills all cells
	that.clear = function(){
		that.rows.forEach(function (row, rowindex, data){
			row.cells.forEach(function (cell, column, array){
				if(cell.isAlive){
					cell.flip();
				}
			})
		})
	};

	//sets up the start states if selected
	that.startState = function(selectedValue){
		if (selectedValue==="criss cross"){
			var start = 0;
			var end = boardWidth-1;
			that.rows.forEach(function(row, rowindex, data){
				row.cells[start].flip();
				row.cells[end].flip();
				if(start===end){
					row.cells[start].flip();
				}
				start++;
				end--;
			});
		}
		else if(selectedValue==="checker"){
			var start;
			var end;
			that.rows.forEach(function(row, rowindex, data){
				row.cells.forEach(function(cell, column, array){
					if(rowindex%2===0 && column%2===0){
						cell.flip();
					}else if(rowindex%2===1 && column%2===1){
						cell.flip();
					}
				})
			});
		}
		else if(selectedValue==="pent"){
			that.rows.forEach(function(row, rowindex, data){
				row.cells.forEach(function(cell, column, array){
					if(rowindex>=8 && rowindex<=15 && column>=11 && column<=13){
						if((rowindex===9 || rowindex===14) && column===12){
							//do nothing
						}else{
							cell.flip();
						}
					}
				})
			});
		}
	}

	Object.seal(that);
	return that;
}


//Dimensions of board are coded in the following two lines
var height =25;
var width = 25;

//View and Controller instances
var board = new Board(height, width);
var controller = new Controller(board, height, width);

//Button onclick methods
var interval;
var hasNotStarted = true;

var start = function(){
	if (hasNotStarted){
		interval = setInterval(controller.start, 100);
		hasNotStarted = false;
	}
}

var stop = function(){
	clearInterval(interval);
	hasNotStarted= true;
}

var erase = function(){
	clearInterval(interval);
	board.clear();
	controller.clear();
	hasNotStarted=true;
}

var startState = function(){
	var selectBox = document.getElementById("selectBox");
	var selectedValue = selectBox.options[selectBox.selectedIndex].value;
	erase();
	board.startState(selectedValue);
	controller.startState(selectedValue);
}

//updates model when user manually changes board 
var updateModel =  function(row,column){
	controller.updateModel(row,column);
}

