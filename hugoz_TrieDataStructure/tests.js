var trie = Trie(["bad","baddy","bad-to-the-bone"]);

QUnit.test( "hello test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});

QUnit.test( "Mixed case text", function ( assert ) {
	var answer = ["bad","baddy","bad-to-the-bone"].sort();
	assert.deepEqual(trie.complete("BAD").sort(),answer);
	assert.deepEqual(trie.complete("Bad").sort(),answer);
	assert.deepEqual(trie.complete("baD").sort(),answer);
	assert.deepEqual(trie.complete("bAd").sort(),answer);
	assert.deepEqual(trie.complete("bAD").sort(),answer);
});

QUnit.test( "Whitespace test", function (assert) {
  assert.raises( function () {
  	complete(" ");
  });
});

QUnit.test("Two words", function (assert) {
	assert.raises( function() {
		complete("harry cat")
	})
});

QUnit.test("Repeating Letters", function (assert){
	assert.raises( function(){
		complete("BeeKeeper")
	})
});

QUnit.test( "Number input", function ( assert ) {
	assert.raises( function () {
		var test_num = String(Math.random());
		complete(test_num);
	});
});
