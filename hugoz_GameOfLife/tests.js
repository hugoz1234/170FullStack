QUnit.test( "hello test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});

QUnit.test("Step Test", function(assert){

	//Simulates user clicking these three cells to create an infinite windmail
	controller.updateModel(1,1);
	controller.updateModel(1,2);
	controller.updateModel(1,3);
	board.rows[1].cells[1].flip();
	board.rows[1].cells[2].flip();
	board.rows[1].cells[3].flip();


	//one iteration
	controller.start()

	//check to make sure rules are correctly enforced and reflected on UI and model
	assert.deepEqual(controller.model.cellData[0][2], true);
	assert.deepEqual(board.rows[0].cells[2].isAlive, true);
	assert.deepEqual(controller.model.cellData[1][2], true);
	assert.deepEqual(board.rows[1].cells[2].isAlive, true);
	assert.deepEqual(controller.model.cellData[2][2], true);
	assert.deepEqual(board.rows[2].cells[2].isAlive, true);
});

QUnit.test("Correct Board Dimensions Test", function(assert){
	var squareBoard = new Board(100,100);
	var squareController = new Controller(squareBoard, 100, 100);

	var rectBoard = new Board(11,41);
	var rectController = new Controller(rectBoard, 11, 41);

	assert.deepEqual(squareBoard.rows.length, 100);
	assert.deepEqual(squareBoard.rows[0].cells.length, 100);
	assert.deepEqual(squareController.model.cellData.length, 100);
	assert.deepEqual(squareController.model.cellData[0].length, 100);

	assert.deepEqual(rectBoard.rows.length, 11);
	assert.deepEqual(rectBoard.rows[0].cells.length,41);
	assert.deepEqual(rectController.model.cellData.length,11);
	assert.deepEqual(rectController.model.cellData[0].length,41);

});

QUnit.test("Clear() Test", function(assert){
	var startStateBoard = new Board(20,20);
	var startStateController = new Controller(startStateBoard, 20, 20);

	startStateBoard.startState("criss cross");
	startStateController.startState("criss cross");
	startStateBoard.clear();
	startStateController.clear();

	var identical = true;
	for (var i=0; i<20;i++){
		for(var j=0;j<20;j++){
			if(startStateBoard.rows[i].cells[j].isAlive!==false){
				identical=false;
			}
			if(startStateController.model.cellData[i][j]!==false){
				identical=false;
			}
		}
	}

	assert.deepEqual(identical, true);
});

QUnit.test("Game of Life Rules Test", function(assert){
	//copy/past from model 
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

	assert.deepEqual(checkRules(true,1), false);
	assert.deepEqual(checkRules(true,2), true);
	assert.deepEqual(checkRules(true,3), true);
	assert.deepEqual(checkRules(true,4), false);
	assert.deepEqual(checkRules(false,3), true);
	assert.deepEqual(checkRules(false,4), false);
});

QUnit.test("Flip() Tests", function(assert){
	var b = new Board(10,10);
	var c = new Controller(b,10,10);

	b.rows[0].cells[0].flip();
	c.model.flip(0,0);

	assert.deepEqual(b.rows[0].cells[0].isAlive===c.model.cellData[0][0], true);
});

//Qunit.test("Game rule test", function(assert))