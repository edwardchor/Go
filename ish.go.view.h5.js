// Ish.Go namespace declaration
var Ish = Ish || {};
Ish.Go = Ish.Go || {};

// begin Ish.Go.View namespace
Ish.Go.View = new function() {

	var canvas;
	var context;
	var isBoardMarked = false;

	// Static object for storing constants
	var ViewConstants = new function() {
		this.boardWidth = 7;
		this.boardHeight = 7;
		this.boardPadding = 20;
		this.pieceWidth = 46;
		this.pieceHeight = 46;
		this.pixelWidth = 342;
		this.pixelHeight = 342;
		this.imgPieceBlack = "piece-black.png";
		this.imgPieceWhite = "piece-white.png";
		this.imgFlagBlack = "flag-black.png";
		this.imgFlagWhite = "flag-white.png";
	};

	// Object for tracking xy coords
	var Coords = function(x, y) {
		this.x = x;
		this.y = y;
	};

	// Tracks clicks on the board (canvas)
	var clickListener = function(e) {
	    console.log("In clickListener! Current player is",gGameState.currentPlayer);
	    if(gGameState.currentPlayer=='black'){
            var point = Ish.Go.View.getPoint(e);
            if (point && !isBoardMarked) {
                Ish.Go.View.placePiece(point);
                // Ish.Go.View.alphaPlacePiece(point);
            }
        }else{
	        console.log("Current player is white, alpha, should let alpha play.")
        }

	};

	// Tracks mouse movement over the board (canvas)
	var mouseMoveListener = function(e) {
		var coords = Ish.Go.View.getCanvasCoords(e);
		var point = Ish.Go.View.getPoint(e);
		
		$("#coords").html("(" + coords.x + ", " + coords.y + ")");
		
		if (point) {
			$("#point").html("(" + point.row + ", " + point.column + ")");
		} else {
			$("#point").html("(-, -)");
		}
	};
	
	/**
	 * Initializes a canvas and context for use in the View, but only if necessary
	 */
	var initCanvas = function() {
		if ($("#go-canvas").length == 0 || !canvas || !context) {
			canvas = document.createElement("canvas");
			canvas.id = "go-canvas";
			$("#board").append(canvas);
		
			canvas.width = ViewConstants.pixelWidth;
			canvas.height = ViewConstants.pixelHeight;
			canvas.style.background = "transparent url(board_1.png) no-repeat 0 0";
			
			canvas.addEventListener("click", clickListener, false);
			canvas.addEventListener("mousemove", mouseMoveListener);
			
			context = canvas.getContext("2d");
		}
	};

	// Given a mouse event, returns Coords relative to the canvas
	this.getCanvasCoords = function(e) {
		var x, y;
		
		// Get xy coords on page
		if (e.pageX != undefined && e.pageY != undefined) {
			x = e.pageX;
			y = e.pageY;
		} else {
			x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		
		// Narrow xy coords to canvas
		x -= canvas.offsetLeft;
		y -= canvas.offsetTop;
		
		return new Coords(x, y);
	};

	// Returns board Point from mouse event, or null if not a valid Point
	this.getPoint = function(e) {
		var coords = this.getCanvasCoords(e);
		var x = coords.x;
		var y = coords.y;
		
		// Remove padding from coords
		x -= ViewConstants.boardPadding;
		y -= ViewConstants.boardPadding;
		
		// Check if xy coords are in the padding
		if (x <= 0 || x >= ViewConstants.pixelWidth - (2 * ViewConstants.boardPadding) ||
				y <= 0 || y >= ViewConstants.pixelHeight - (2 * ViewConstants.boardPadding)) {
			return null;
		}
		
		// Get Point from xy coords on canvas
		var point = new Point(
			Math.floor(y/ViewConstants.pieceHeight),	// row
			Math.floor(x/ViewConstants.pieceWidth)	// column
		);
		return point;
	};

	// Given a Point, returns the top-left Coords on the canvas
	this.getCoordsFromPoint = function(point) {
		return new Coords(
			((point.column) * ViewConstants.pieceWidth) + ViewConstants.boardPadding,
			((point.row) * ViewConstants.pieceHeight) + ViewConstants.boardPadding
		);
	};

	// Places piece, and draws changes on the board
    this.alphaPlacePiece=function(humanPoint){
        console.log(humanPoint);
        var passValue = {
            'humanMove':{'r':humanPoint.row, 'c':humanPoint.column}
        };
        console.log(passValue);

        var getAlphaMove={
            type: 'POST',
            url: "http://deeplearning.edwardchor.com:8000/game/next/",
            data: passValue,
            timeout: 300000,
            success:function(data){
                console.log(data);
                m=data.AlphaMove;
                if(!m){
                    console.log("Game Over, Winner:", data.result);
                    alert(data.result,"Win!");
                    return
                }
                var y=m[0];
                var x=m[1];

                var alphaPoint=new Point(
                    y,	// row
                    x
                );

                console.log(alphaPoint);

                var moveResult = Ish.Go.Logic.move(alphaPoint.row, alphaPoint.column);

                // Check for empty MoveResult (indicates invalid move)
                if (!moveResult) {
                    var alertMsg = "Invalid Move";
                    // console.log(alertMsg+gGameState.currentPlayer);
                    // Add specific message if present
                    if (gGameState.moveError) {
                        alertMsg += ":\n" + gGameState.moveError;
                    }


                    alert(alertMsg);
                    return;
                }
                console.log(moveResult);

                Ish.Go.View.update(moveResult);
                console.log("Alpha Move updated, current player: "+gGameState.currentPlayer)

            },
            error:function(e){
                $.ajax(getAlphaMove)
            },
            complete:function(data){
                console.log("completed!");

            },
            dataType: 'json',
        };

        $.ajax(getAlphaMove)
        //
        // $.ajax({
        // type: 'POST',
        // url: "http://deeplearning.edwardchor.com:8000/game/next/",
        // data: passValue,
        // timeout: 300000,
        // success:function(data){
        //     console.log(data);
        //     m=data.AlphaMove;
        //     if(!m){
        //         console.log("Game Over, Winner:", data.result);
        //         alert(data.result,"Win!");
        //         return
        //     }
        //     var y=m[0];
        //     var x=m[1];
        //
        //     var alphaPoint=new Point(
        //         y,	// row
        //         x
        //     );
        //
        //     console.log(alphaPoint);
        //
        //     var moveResult = Ish.Go.Logic.move(alphaPoint.row, alphaPoint.column);
        //
        //     // Check for empty MoveResult (indicates invalid move)
        //     if (!moveResult) {
        //         var alertMsg = "Invalid Move";
        //         // console.log(alertMsg+gGameState.currentPlayer);
        //         // Add specific message if present
        //         if (gGameState.moveError) {
        //             alertMsg += ":\n" + gGameState.moveError;
        //         }
        //
        //
        //         alert(alertMsg);
        //         return;
        //     }
        //     console.log(moveResult);
        //
        //     Ish.Go.View.update(moveResult);
        //     console.log("Alpha Move updated, current player: "+gGameState.currentPlayer)
        //
        //     },
        //     error:function(e){
        //
        //     },
        //     complete:function(data){
        //         console.log("completed!");
        //
        //     },
        // dataType: 'json',
        // }).done(function(data){
        //     console.log("done data:",data)
        // });




    };

	this.placePiece = function(point) {

		console.log("in this.placePiece! Current Player:"+gGameState.currentPlayer);
        console.log(point);

        var moveResult = Ish.Go.Logic.move(point.row, point.column);
        
        // Check for empty MoveResult (indicates invalid move)
        if (!moveResult) {
			var alertMsg = "Invalid Move";
			// console.log(alertMsg+gGameState.currentPlayer);
			// Add specific message if present
			if (gGameState.moveError) {
				alertMsg += ":\n" + gGameState.moveError;
			}
			
			alert(alertMsg);
            return;
        }
        console.log(moveResult);

        this.update(moveResult);
        console.log("Move updated, current player: "+gGameState.currentPlayer);
		// Redraw board changes as a result of the move and post the data to server

        Ish.Go.View.alphaPlacePiece(point)

	};




	/**
	 * Draws piece on canvas
	 */
	this.drawPiece = function(point, color) {	
		var coords = this.getCoordsFromPoint(point);
		
		var piece = new Image();
		
		if (color == Constants.Color.BLACK) {
			piece.src = ViewConstants.imgPieceBlack;
		} else {
			piece.src = ViewConstants.imgPieceWhite;
		}
		
		piece.onload = function() {
			context.drawImage(piece, coords.x, coords.y);
		};
	};
	
	/**
	 * Draws territory on canvas
	 */
	this.drawTerritory = function(point, owner) {
		var coords = this.getCoordsFromPoint(point);
		
		var territory = new Image();
		
		if (owner == Constants.TerritoryOwner.BLACK) {
			territory.src = ViewConstants.imgFlagBlack;
		}
		else if (owner == Constants.TerritoryOwner.WHITE) {
			territory.src = ViewConstants.imgFlagWhite;
		}
		else { // Neutral
			return;
		}
		
		territory.onload = function() {
			context.drawImage(territory, coords.x, coords.y);
		};
	};
    
    this.removePieces = function(points) {
        var coords;
        $.each(points, function() { 
            coords = Ish.Go.View.getCoordsFromPoint(this);
            context.clearRect(
                coords.x,
                coords.y,
                ViewConstants.pieceWidth,
                ViewConstants.pieceHeight
            );
        });
    };
    
    this.update = function(moveResult) {
        if (moveResult){
            // Draw only board changes
            this.drawPiece(moveResult.newPoint, moveResult.player.color);
            this.removePieces(moveResult.capturedPoints);
			
			this.drawInfo();
        }
    };
    
    this.redraw = function(canvasElement) {
        // Create canvas and context if necessary
        if (!canvasElement) {
			initCanvas();
        }
        
		this.drawBoard();
		this.drawInfo();
    };
	
	this.drawBoard = function() {
        context.clearRect(0, 0, ViewConstants.pixelWidth, ViewConstants.pixelHeight);        
        var point;
        var pState;
        for (var y = 0; y < gGameState.boardHeight; y++) {
            for (var x = 0; x < gGameState.boardWidth; x++) {
                point = new Point(y, x);
                pState = gGameState.getPointStateAt(point);
                if (pState == Constants.PointState.BLACK) {
                    this.drawPiece(point, Constants.Color.BLACK);
                }
                else if (pState == Constants.PointState.WHITE) {
                    this.drawPiece(point, Constants.Color.WHITE);
                }
            }
        }	
	};
	
	this.drawMarkedBoard = function() {
		var markedBoard = Ish.Go.Logic.getMarkedBoard();
		
        context.clearRect(0, 0, ViewConstants.pixelWidth, ViewConstants.pixelHeight);
        for (var y = 0; y < gGameState.boardHeight; y++) {
            for (var x = 0; x < gGameState.boardWidth; x++) {				
                this.drawTerritory(new Point(y,x), markedBoard[y][x]);
            }
        }
	};
	
	this.drawInfo = function() {
		// Print turn
        var curTurnKind;
        if(gGameState.currentPlayer=='black'){
            curTurnKind='Human'
        }else{
            curTurnKind='Alpha'
        }

		$("#turn").html("Current Turn: "+ gGameState.currentPlayer.color+","+curTurnKind);
		
		// Print scores		
		Ish.Go.Logic.setScores();
		
		var p1 = gGameState.player1;
		var p2 = gGameState.player2;
		
		$("#score").html("Score:" +
			"<br>&nbsp;&nbsp;" +
			p1.color + ": " + p1.score +
			"<br>&nbsp;&nbsp;" +
			p2.color + ": " + p2.score);		
	};
	
	/**
	 * Starts a new game.
	 */
	this.startNewGame = function() {
		Ish.Go.Logic.newGame(7, 7);
		this.redraw($("go-canvas"));
	};

	/**
	 * Prints code defining current game state on web page
	 */
	this.printGameState = function(aId) {
		var id = aId || 'gameState';
		var sBoard = "";

		// Initialize game state
		sBoard += "gGameState = new GameState(\n";
		sBoard += "\t" + gGameState.boardWidth + ",\n";
		sBoard += "\t" + gGameState.boardHeight + ",\n";
		sBoard += "\tnew Player(Constants.Color.BLACK, Constants.PointState.BLACK),\n";
		sBoard += "\tnew Player(Constants.Color.WHITE, Constants.PointState.WHITE)\n";
		sBoard += ");\n";

		// Set current player
		sBoard += "gGameState.currentPlayer = " +
			(gGameState.currentPlayer == gGameState.player1 ?
				"gGameState.player1;\n" :
				"gGameState.player2;\n");
		
		// Set board
		for (var y = 0; y < gGameState.boardHeight; y++) {
			sBoard += "gGameState.board[" + y + "] = [";
			for (var x = 0; x < gGameState.boardWidth; x++) {
				
				sBoard += "\"" + gGameState.board[y][x] + "\",";
			}
			sBoard = sBoard.substring(0, sBoard.length-1);
			sBoard += "];\n";
		}
		
		// Set previous board
		for (var y = 0; y < gGameState.boardHeight; y++) {
			sBoard += "gGameState.previousBoard[" + y + "] = [";
			for (var x = 0; x < gGameState.boardWidth; x++) {
				sBoard += "\"" + gGameState.previousBoard[y][x] + "\",";
			}
			sBoard = sBoard.substring(0, sBoard.length-1);
			sBoard += "];\n";
		}
		
		$("#" + id).html("<textarea>" + sBoard + "</textarea>");
	};
	
	/**
	 * Toggles between showing a regular or marked board.
	 * Merely calls appropriate print functions.
	 */
	this.toggleMarkedBoard = function() {
		isBoardMarked ?	this.drawBoard() : this.drawMarkedBoard();
		isBoardMarked = !isBoardMarked;
	};

	var gettingData = function(){
		$.ajax({
  		type: 'POST',
  		url: "http://deeplearning.edwardchor.com:8000/game/next/",
  		dataType: 'json',
  		success:function(res) {
  			var resobj =  jQuery.parseJSON(res);
  			var respoint = resobj.AlphaMove;
  			Ish.Go.View.placePiece(respoint);
		}
		});
	};
	
	this.init = function() {
		// Initialize game state
		gGameState = new GameState(
			7,
			7,
			new Player(Constants.Color.BLACK, Constants.PointState.BLACK),
			new Player(Constants.Color.WHITE, Constants.PointState.WHITE)
		);
		
		//start refresh
		// setInterval(gettingData,3000);

        var passValue = {
            'init':true
        };
        $.ajax({
            type: 'POST',
            url: "http://deeplearning.edwardchor.com:8000/game/init/",
            data: passValue,
            success:function(data){
            console.log("init done")
            console.log(data)

            },
            dataType: 'json',
        });

		this.redraw();
	};
	
}; // end Ish.Go.View namespace