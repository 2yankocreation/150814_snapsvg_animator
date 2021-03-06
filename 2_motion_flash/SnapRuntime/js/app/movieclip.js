/*global define $ requestAnimationFrame*/

define(function (require) {
	
	var MovieClip,
		CMD = require('app/commands');
	
	MovieClip = function (parentMC, commandTimeline, resourceManager, objectID, placeAfter, transform) {
		var i,
			transformMat,
            transformData,
            transformArray,
            afterEl,
            parentEl = parentMC.type == 'svg' ? parentMC : parentMC.el;  //parent is stage if svg

        if (objectID) {
            this.id = objectID;
        }
    	this.el = parentEl.g();
        this.el.attr({'class': 'movieclip', 'token': this.id});
		this.transform = transform;

		this.m_timeline = commandTimeline;
		this.m_currentFrameNo = 0;
		this.m_frameCount = this.m_timeline.Frame.length;

		this.children = [];
        this.isMask = false;
        this.isMasked = false;
        this.mask = null;
        this.maskElement = null;
        this.maskTill = null;

		if(this.transform !== undefined) 
		{
			transformData = this.transform;
			transformArray = transformData.split(",");
			transformMat = new Snap.Matrix(transformArray[0],transformArray[1],transformArray[2],transformArray[3],transformArray[4],transformArray[5]);
			this.el.transform(transformMat);
		}

        if (placeAfter && parseInt(placeAfter) !== 0) {
            afterMC = parentMC.getChildById(parseInt(placeAfter));
            afterMC.el.before(this.el);
        } else {
            parentEl.add(this.el);         
        }
	};

    MovieClip.prototype.getChildById = function (id) {
        var i;

        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i].id == id) {
                return this.children[i];
            }
        }

        return false;
    };

    MovieClip.prototype.getChildIndexById = function (id) {
        var i;

        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i].id == id) {
                return i;
            }
        }

        return false;
    };

    MovieClip.prototype.removeChildById = function (id) {
        var i;

        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i].id == id) {
                this.children.splice(i, 1);
                return;
            }
        }
    };

    MovieClip.prototype.swapChildIndex = function (id, placeAfter) {
        var i,
            child;

        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i].id == id) {
                child = this.children.splice(i, 1);
                break;
            }
        }

        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i].id == placeAfter) {
                this.children.splice(i + 1, 0, child[0]);
                break;
            }
        }
    };

    MovieClip.prototype.insertAtIndex = function (child, placeAfter) {
        var i;

        if (parseInt(placeAfter) === 0) {
            this.children.unshift(child);
        }

        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i].id == placeAfter) {
                this.children.splice(i + 1, 0, child);
                break;
            }
        }
    };

    MovieClip.prototype.containsMask = function () {
        var i;

        for (i = 0; i < this.children.length; i += 1) {
            if (this.children[i].isMask) {
                return true;
            }
        }

        return false;
    };

    MovieClip.prototype.loop = function (commandList) {
        var frame,
            commands,
            children,
            i,
            found,
            cmData,
            type;

        if(this.m_currentFrameNo == this.m_frameCount) {
			this.m_currentFrameNo = 0;

	    	frame = this.m_timeline.Frame[this.m_currentFrameNo];	

	    	if (!frame) {
	    		return;
	    	}

	    	//Get the commands for the first frame
	    	commands = frame.Command;	

	    	// Iterate through all the elements in the display list
		    // check if same instance exists in the first frame 
            for (i = 0; i < this.children.length; i += 1) {

                found = false;
                child = this.children[i];

                for (c = 0; c < commands.length; ++c) {
                    cmdData = commands[c];
                    type = cmdData.cmdType;

                    if (type == "Place") {
                        if (parseInt(child.id) == parseInt(cmdData.objectId)) {
                            found = true;
                            break;
                        }
                    }
                }

                if (found === false) {
                    command = new CMD.RemoveObjectCommand(child.id);
                    commandList.push(command);
                }
            }
		}
    };

	MovieClip.prototype.play = function (resourceManager) {
        var commandList = [],
            frame,
            i,
            c,
            found,
            commands,
            command,
            cmdData,
            type;

        //play movieclips
		for(i = 0; i < this.children.length; i += 1)
		{
            if (this.children[i].play) {
			    this.children[i].play(resourceManager);
            }
		}

        //check to handle looping of movieclip
        this.loop(commandList);

		frame = this.m_timeline.Frame[this.m_currentFrameNo];
	  	if (!frame) {
	  		return;
    	}

		commands = frame.Command;
		for(c = 0; c < commands.length; c += 1)
		{
			cmdData = commands[c];
			type = cmdData.cmdType;
			command = null;

			switch(type)
			{
				case "Place":

                    found = this.getChildById(cmdData.objectId);

			        if (!found) {
			            command = new CMD.PlaceObjectCommand(cmdData.charid, cmdData.objectId, cmdData.placeAfter, cmdData.transformMatrix);
			            commandList.push(command);
			        } else {
			            command = new CMD.MoveObjectCommand(cmdData.objectId, cmdData.transformMatrix);
			            commandList.push(command);
			            command = new CMD.UpdateObjectCommand(cmdData.objectId, cmdData.placeAfter);
			            commandList.push(command);
			        }

				break;
				case "Move":
					command = new CMD.MoveObjectCommand(cmdData.objectId, cmdData.transformMatrix);
					commandList.push(command);
				break;
				case "Remove":
					command = new CMD.RemoveObjectCommand(cmdData.objectId);
					commandList.push(command);
				break;
				case "UpdateZOrder":
					command = new CMD.UpdateObjectCommand(cmdData.objectId , cmdData.placeAfter);
					commandList.push(command);
				break;
				case "UpdateVisibility":
					command = new CMD.UpdateVisibilityCommand(cmdData.objectId , cmdData.visibility);
					commandList.push(command);
				break;
				case "UpdateColorTransform":
					command = new CMD.UpdateColorTransformCommand(cmdData.objectId , cmdData.colorMatrix);
					commandList.push(command);
				break;
				case "UpdateMask":
					command = new CMD.UpdateMaskCommand(cmdData.objectId , cmdData.maskTill);
					commandList.push(command);
				break;
			}

		}

        if (this.containsMask) {
            command = new CMD.ApplyMaskCommand();
            commandList.push(command);
        }
	
		for (i = 0; i < commandList.length ; i++)
		{
			if (commandList[i] !== undefined) {
			     commandList[i].execute(this, resourceManager);
			}
		}

		this.m_currentFrameNo++;

		//this.cleanupUnusedDefs(); //perf hit
	};
	
	/**
	* clean up unused defs
	**/
    /*
	MovieClip.prototype.cleanupUnusedDefs = function () {
		var that = this,
			defs = this.el.selectAll('defs>*'),
			j,
			i,
			id,
			toRemove;
		
		for (j = 0; j < defs.length; j += 1) {
			id = defs[j].attr('id');

			if (!id) {
				continue;
			}

			url = "url('#" + id + "')";
			fill = that.el.select('[fill="' + url + '"]');
			mask = that.el.select('[mask="' + url + '"]');

			if (!fill && !mask) {
				console.log('remove');
				defs[j].remove();
			}
		}

		//clear all groups moved to defs
		defGroups = this.el.selectAll('defs>g');
		for (i = 0; i < defGroups.length; i += 1) {
			defGroups[i].remove();
		}

		//clear all unused masks
		masks = this.el.selectAll('defs>mask');
		for (i = 0; i < masks.length; i += 1) {
			if (!masks[i].attr('id')) {
				masks[i].remove();
			}
		}

	};
    */
	
	return MovieClip;
});
