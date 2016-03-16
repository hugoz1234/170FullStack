proj2
=====
A) What concerns you identified, and how you separated them:
	- The concerns I identified were the internal, database represenation of the state of the board and the UI visualization of the board. I bridge the gap between the two with a controller which reflects changes made in module onto the other components of the program. 

B) What the program modules are, what their dependences are on one another, and whether there are any dependences that should ideally be eliminated:
	- I made a separate module for each component of the MVC design pattern; the controller holds an instance of the model and the view in order to facilate the transfer of information. The Controller also handles update both the view and controller through iterations, using a subscriber design pattern to execute the changes necessary in the model. Currently the model and the view depend on having the same dimesions; the dimensions of each are declared as global variable in the board.js. Ideally the view should adapt to the dimentions of the model. 

C) How you exploited functionals in your code: 
	- I used functions many times over to iteration through the cells both in the View and through their representative data model in the Model. In addition when first populating the Model I used the times() functional to do simple, repeated operations however for the view I found it more functional, easier to understand and less bug prone to use two nested for loops to populate the view with the appropriate view objects.

D) Any interesting design ideas you had or tradeoffs that you made:
	- I kept two separate board representations, one in the View and one in the Model in order to make lookup operations more intuitive. However it is more bug prone as iterations needs to be done very carefully, since updates require updating both representations. 
