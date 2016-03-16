/* allwords- array of string words which will be represented by Trie structure
	Letter cases are ignored, represented as lower case.

*/
var Trie = function(allwords){
	var that = Object.create(Trie.prototype);
	that.nodes = [];

	var Node = function(isLast, letter){
		var node = Object.create(Node.prototype);
		node.isLast = isLast;
		node.letter = letter;
		node.children = [];

		node.addNode = function(x){
			node.children.push(x);
		}

		return node;

	}

	/*
		returns the node representing the letter parameter; 
		assumes it already exists in list
	*/
	that.findLetter = function(let, listOfNodes){
		var node; 

		listOfNodes.forEach(function(element, index,array){
			if(array[index].letter===let){
				node = array[index];
			}
		});
		
		return node;
	}

	/*
		Adds word into trie.nodes, letter-by-letter. 
	*/
	that.insert = function(word){
		var wordSoFar = "";
		var word = word.toLowerCase();

		var isChild = function(letter, nodes){
			//array containing a true boolean if node is found in node.children
			var nodesWithLetter = nodes.filter(function(item) {
				if (item.letter === letter) {
					return true;
				}
			});

			return nodesWithLetter.length>0;
		}

		var insertNode = function(letter, isLast){
			var parentNode = that.findLetter(wordSoFar[0], that.nodes);

			//Did not use functional for setting parentNode since iteration starts at index=1--TA said it was ok
			for(var x = 1;x<wordSoFar.length;x++){
				parentNode = that.findLetter(wordSoFar[x], parentNode.children);
			}

			if((parentNode===undefined || isChild(letter, parentNode.children)) && !(wordSoFar.indexOf(letter)>-1) &&!isLast){

				return;
			}

			if(!isChild(letter, parentNode.children)){
				var node = Node(isLast, letter);
				parentNode.children.push(node);	
			} else if(isLast){
				var node = that.findLetter(letter, parentNode.children);
				node.isLast = true;
			}
	
		}

		var isOneLetterWord = word.length===1; 


		for(var i = 0; i<word.length;i++){//loop through letters
			var isLast = i===word.length-1;

			if(!isChild(word[i], that.nodes) && wordSoFar===""){
			 	var node = Node(isLast, word[i]);
				that.nodes.push(node)
			}else{
				var node;
				if(isOneLetterWord){ //for one letter case
					node = that.findLetter(word[i], that.nodes);
					node.isLast = true;		
				}else{
					insertNode(word[i], isLast);
				}
			}

			wordSoFar += word[i];
		}	
	}

	/*
		Returns a lexicgraphically sorted array of all words which could be auto completed given an input
	*/
	that.complete = function(string){
		var string = string.toLowerCase();
		var rootNode = that.findLetter(string[0], that.nodes);
		var resultWords = [];

		if(rootNode===undefined){
			return [];
		}

		var walkdown = function(node, pastString){//walks down a single path 
			var returnString = pastString + node.letter;

			if(node.isLast){
				resultWords.push(returnString);
			}

			for(var x=0; x<node.children.length;x++){
				walkdown(node.children[x], returnString)
			}
		}

		//Did not use functional for setting root node since iteration starts at index=1--TA said it was ok
		for(var i = 1; i<string.length;i++){ //finds the valid subtree
			rootNode = that.findLetter(string[i], rootNode.children);
			if(rootNode===undefined){
				return [];
			}
		}

		var ignoredLetters = string.substring(0,string.length-1);
		walkdown(rootNode, ignoredLetters);
		return resultWords.sort();
	}	

	//inserts each word into trie structure
	allwords.forEach(function(element, index, array){
		that.insert(element);
	});

	Object.freeze(that);
	return that; 
}