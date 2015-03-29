'use strict';
/**
 * @ngdoc function
 * @name joshgameApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the joshgameApp
 */
var mod = angular
        .module('firebaseMultiplayerExample', [
        ]);

angular.module('firebaseMultiplayerExample')
        .controller('MainCtrl', function ($scope, $log, $timeout) {
            $scope.directionList = ["e", "n", "ne", "nw", "s", "se", "sw", "w"];
            $scope.lumberjackDirection = $scope.directionList[0];
            $scope.hitAnimationTime = 900;
            $scope.width = 800;
            $scope.height = 800;
            $scope.heroWidth = 96;
            $scope.heroHeight = 96;
            $scope.speed = 90; //px/s
            $scope.arrowSpeed = 300; //px/s
            $scope.maxArrowDistance = 300; //px
            $scope.firebaseUrl = '//amber-fire-8177.firebaseIO.com/';

            $scope.animations = {knight: [{action: "walk", startRow: 16, numFrames: 8, animSpeed: 800}, {action: "knock_down", startRow: 8, numFrames: 9, animSpeed: $scope.hitAnimationTime}]};
            $scope.username;
            $scope.firebase;
            $scope.otherPlayers = {};
            $scope.arrows = {};
            $scope.arrowIndex = 0;
            $scope.thisFirebasePlayer = null;
            $scope.getArrowCellIndex = function (angle) {

                var index = Math.floor((angle) / (360 / 32));
                $log.log("Index = " + index);
                var row = Math.floor(index / 8);
                var column = index % 8;
                $log.log("Angle translates to " + column + "," + row);
                return {x: column, y: row};
            }
//            $scope.particleOptions = {
//                maxParticles: 100,
//                size: 30,
//                sizeRandom: 4,
//                speed: 1,
//                speedRandom: 1.2,
//                // Lifespan in frames
//                lifeSpan: 150,
//                lifeSpanRandom: 7,
//                // Angle is calculated clockwise: 12pm is 0deg, 3pm is 90deg etc.
//                angle: 65,
////                angleRandom: 34,
//                startColour: [255, 131, 0, 1],
//                startColourRandom: [48, 50, 45, 0],
//                endColour: [245, 35, 0, 0],
//                endColourRandom: [60, 60, 60, 0],
//                // Only applies when fastMode is off, specifies how sharp the gradients are drawn
//                sharpness: 20,
//                sharpnessRandom: 10,
//                // Random spread from origin
//                spread: 1,
//                // How many frames should this last
//                duration: 10,
//                // Will draw squares instead of circle gradients
//                fastMode: false,
//                gravity: {x: 0, y: 0.0},
//                // sensible values are 0-3
//                jitter: 0
//            };



            $scope.connect = function () {
                if (!$scope.username || $scope.username.length <= 3) {
                    alert("Username must be at least 4 characters");
                    return;
                }
                if ($scope.thisFirebasePlayer) {
                    alert("You already signed in");
                    return;
                }
                $scope.playerText = Crafty.e("2D, Canvas, Text").text($scope.username).attr({x: $scope.startX + 48, y: $scope.startY});
                $scope.player2 = Crafty.e("Hero, knight, Tween, SpriteAnimation, CharAnims, MouseFace, moveable, arrowShooter, canBeHit").attr({x: $scope.startX, y: $scope.startY})
                        .bind("MouseDown", function (data) {
                            if(this.isHit){
                                return;
                            }
                            //$log.log("mouse click: " + angular.toJson(data));
                            $log.log("Current position: " + this.x + "," + this.y);
                            if (data.mouseButton == Crafty.mouseButtons.LEFT) {
                                var start = {x: this.x, y: this.y};
                                var end = {x: data.realX, y: data.realY};
                                this.move(end);
                                $scope.thisFirebasePlayer.update({action: {end: end}});
                            } else if (data.mouseButton === Crafty.mouseButtons.RIGHT) {
                                this.shootArrow({x: data.realX, y: data.realY});
                            }
                        }).CharAnims($scope.animations.knight);
                $scope.player2.canBeHit();
                $scope.player2.attach($scope.playerText);
                Crafty.viewport.follow($scope.player2, 0, 0);
                var playerObj = {player: $scope.username, x: $scope.player2.attr("x"), y: $scope.player2.attr("y")}
                $log.log("Player obj: " + angular.toJson(playerObj));
                $scope.thisFirebasePlayer = $scope.firebase.push(playerObj);
                $scope.thisFirebasePlayer.onDisconnect().remove();
                setInterval(function () {
//                    $log.log("Player x: "+$scope.player2.x);
                    $scope.thisFirebasePlayer.update({x: $scope.player2.x, y: $scope.player2.y});
                }, 500);
            }

            $scope.init = function () {
                Crafty.init(800, 600);
                Crafty.canvas.init("cr-stage");
                Crafty.c("Hero", {
                    init: function () {
                        this.addComponent("2D, Canvas, Color, MouseFace");
                        this.w = $scope.heroWidth; // width
                        this.h = $scope.heroHeight; // height
//                        this.color("red");
                    }
                });
                Crafty.c('shooter', {shoot: function (aimingPoint) {
                        var deltaY = (aimingPoint.y - (this.y + 48));
                        var deltaX = (aimingPoint.x - (this.x + 48));
                        var computedAngle = Math.atan2(deltaY, deltaX) / Math.PI * 180.0;
                        if (computedAngle < 0) {
                            computedAngle = (computedAngle + 360);
                        }
                        var particle = $.extend($scope.particleOptions, {});
                        particle.angle = computedAngle;
                        $log.log("Shooting particle: " + angular.toJson(particle));
                        var entityX = this.x;
                        var entityY = this.y;
                        Crafty.e("2D,Canvas,Particles").attr({x: entityX, y: entityY}).particles(particle);
                    }});
                Crafty.c("arrowShooter", {shootArrow: function (end) {
                        var start = {x: this.x + 48, y: this.y + 48};
                        var end = {x: end.x, y: end.y};
                        var uuid = Math.random();
                        var arrowObj = {type: "arrow", start: start, end: end, uuid: uuid};
                        var firebaseArrow = $scope.firebase.push(arrowObj);
                        firebaseArrow.onDisconnect().remove();
                        $scope.arrows[uuid] = firebaseArrow;

                    }});
                Crafty.c('moveable', {direction: "e", move: function (end) {
                        var deltaY = (end.y - (this.y + 48));
                        var deltaX = (end.x - (this.x + 48));
                        var computedAngle = Math.atan2(deltaY, deltaX) / Math.PI * 180.0;
                        if (computedAngle < 0) {
                            computedAngle = (computedAngle + 360);
                        }
                        var angle = computedAngle; //this.getAngle() * 180 / Math.PI;
                        var distance = Math.sqrt(deltaY * deltaY + deltaX * deltaX);
                        var time = Math.round(1000 * distance / $scope.speed);
                        $log.log("Covering " + distance + " pixels in " + time + " ms");
                        $log.log("Movingi n " + time + " ms");
                        var gameX = end.x - 48;
                        var gameY = end.y - 48;
                        this.tween({x: gameX, y: gameY}, time)
                                .bind("TweenEnd", function () {
                                    $log.log("tween complete");
                                });
                        ;
                        $log.log("computedAngle = " + computedAngle + " angle: " + angle);

                        var action = "";
                        var dir = "";
                        if (angle >= 0 && angle < 22.5) {
                            dir = "e";
                            action = "walk_e"
                        } else if (angle >= 22.5 && angle < 67.5) {
                            dir = "se";
                            action = "walk_se";
                        } else if (angle >= 67.5 && angle < 112.5) {
                            dir = "s";
                            action = "walk_s";
                        } else if (angle >= 112.5 && angle < 157.5) {
                            dir = "sw";
                            action = "walk_sw";
                        } else if (angle >= 157.5 && angle < 202.5) {
                            dir = "w";
                            action = "walk_w";
                        } else if (angle >= 202.5 && angle < 247.5) {
                            dir = "nw";
                            action = "walk_nw";
                        } else if (angle >= 247.5 && angle < 292.5) {
                            dir = "n";
                            action = "walk_n";
                        } else if (angle >= 292.5 && angle < 337.5) {
                            dir = "ne";
                            action = "walk_ne";
                        } else {
                            dir = "e";
                            action = "walk_e";
                        }
                        this.direction = dir;
                        this.destX = end.x;
                        this.destY = end.y;
                        this.animate(action, -1);
                    }});
                Crafty.c("canBeHit", {
                    isHit: false,
                    canBeHit: function () {
                        this.requires("Collision");
                        this.collision();
                        this.checkHits('arrow') // check for collisions with entities that have the Solid component in each frame
                                .bind("HitOn", function (hitData) {
                                    if (!this.isHit) {
                                        this.isHit = true;
                                        $log.log("Collision with Solid entity occurred for the first time.");
                                        var action = "knock_down" + "_" + this.direction;
                                        this.animate(action, 1);
                                        this.cancelTween("x");
                                        this.cancelTween("y");
                                        var character = this;
                                        $timeout(function () {
                                            character.animate("walk_" + character.direction, -1);
                                            character.attr({isHit : false});
                                        }, $scope.hitAnimationTime + 100);
                                    }
                                })
                                .bind("HitOff", function (comp) {
                                    $log.log("Collision with Solid entity ended.");
                                });
                        return this;

                    }
                });
                Crafty.c('firebase', {
                    firebaseRef: 'temp value',
                    setFirebaseRef: function (ref) {
//                        $log.log("Setting firebase ref. Replacing temp value: "+this.firebaseRef+" with firebase ref with name: "+ref.key());
                        this.firebaseRef = ref;
                    },
                    firebaseRemove: function () {

                        $log.log("firebase key name: " + this.firebaseRef.key().name());
                        this.firebaseRef.key().remove();
                    }
                });
                Crafty.c('CharAnims', {
                    CharAnims: function (animationInfo) {
                        this.requires("SpriteAnimation, Grid");
                        for (var j = 0; j < animationInfo.length; j++) {
                            var actionInfo = animationInfo[j];
                            var actionName = actionInfo.action;
                            var startRow = actionInfo["startRow"];
                            var numFrames = actionInfo["numFrames"];
                            var animSpeed = actionInfo["animSpeed"];
                            for (var i = 0; i < $scope.directionList.length; i++) {
                                var action = actionName + "_" + $scope.directionList[i];
                                var row = startRow + i;
                                //$log.log("Creating reel: " + action + " row: " + row + " numFrames: " + numFrames + " animSpeed: " + animSpeed);
                                this.reel(action, animSpeed, 0, row, numFrames);
                            }

                        }
                        $log.log("in CharAnims definition");
                        return this;
                    }
                });
                Crafty.sprite(32, 64, "images/arrow.png", {arrow: [0, 0]});
                Crafty.sprite(128, "images/trees.png",
                        {tree: [1, 1]});
//                var Player = Crafty.e("Hero").attr({x:10, y:10});
                Crafty.sprite(96, "images/greenKnight.PNG",
                        {knight: [0, 25]});
                $scope.startX = ($scope.width / 2) - ($scope.heroWidth / 2);
                $scope.startY = ($scope.height / 2) - ($scope.heroHeight / 2);

                $scope.tree = Crafty.e("2D, Canvas, tree").attr({x: 600, y: 250});
                $scope.firebase = new Firebase($scope.firebaseUrl);
                $scope.firstLoad = true;
                $scope.firebase.on("value", function (snapshot) {
                    if (!$scope.firstLoad) {
                        return;
                    }

                    $scope.firstLoad = false;
//                    $log.log("snapshot: "+angular.toJson(snapshot));
                    var currentUsers = snapshot.val();
                    $log.log("current users (): " + angular.toJson(currentUsers, true));
                    if (currentUsers) {
                        for (var key in currentUsers) {
                            var obj = currentUsers[key];
                            $log.log("value object: " + angular.toJson(obj));
                            if (obj.player) {
                                $scope.addPlayer(obj);
                            } else if (obj.type === "arrow") {
                                $scope.addArrow(snapshot, obj)
                            }
                        }

                    }
                }, function (err) {
                    $log.log("The read failed: " + err.code + ": obj: " + angular.toJson(err));
                });

                $scope.firebase.on("child_added", function (snapshot) {
                    var value = snapshot.val();
                    $log.log("value = " + angular.toJson(value));
                    if (value.player) {
                        if (value.player !== $scope.username) {
                            $scope.addPlayer(value);
                        }
                    } else if (value.type === "arrow") {
                        $scope.addArrow(snapshot, value);
                    }
                });

                $scope.firebase.on("child_changed", function (snapshot) {
                    var value = snapshot.val();

                    $log.log("child changed called, new value: " + angular.toJson(value));
                    if (value.player && value.player !== $scope.username) {
                        if (value.action.end.x !== $scope.otherPlayers[value.player].destX &&
                                value.action.end.y !== $scope.otherPlayers[value.player].destY) {
                            $scope.otherPlayers[value.player].move(value.action.end);
                        }
                    }
                });

                $scope.firebase.on("child_removed", function (snapshot) {
                    var value = snapshot.val();
                    if (value.player) {
                        $scope.otherPlayers[value.player].destroy();
                    }
                });
            }

            $scope.addArrow = function (firebaseRef, firebaseObj) {
                var start = firebaseObj.start;
                var end = firebaseObj.end;
                var deltaY = (end.y - start.y);
                var deltaX = (end.x - start.x);
                var computedAngleBeforeShift = Math.atan2(deltaY, deltaX);
                var computedAngle = computedAngleBeforeShift / Math.PI * 180.0 + 90;
                $log.log("Angle after 90 degree shift: " + computedAngle);
                if (computedAngle < 0) {
                    computedAngle = (computedAngle + 360);
                }
                $log.log("Shooting arrow at angle: " + computedAngle);
                var arrowSpriteIndex = $scope.getArrowCellIndex(computedAngle);
                var startX = start.x;
                var startY = start.y;
                $log.log("firebase obj: " + angular.toJson(firebaseObj) + " starting at: ");
                var arrow = Crafty.e("2D, Canvas, Sprite, arrow, Tween, firebase, Collision").attr({x: startX, y: startY}).collision();
                arrow.setFirebaseRef(firebaseObj.uuid);
                arrow.sprite(arrowSpriteIndex.x, arrowSpriteIndex.y);
                $log.log("firebaseObj.uuid: " + firebaseObj.uuid);
                arrow.uuid = firebaseObj.uuid;
//                var gameX = end.x - 16;
//                var gameY = end.y - 32;
                var distance = $scope.maxArrowDistance;//Math.sqrt(deltaY * deltaY + deltaX * deltaX);

                var shootAngleInDegrees = computedAngleBeforeShift / Math.PI * 180;
                $log.log("Shoot angle in degrees: " + shootAngleInDegrees);
                var gameX = $scope.maxArrowDistance * Math.cos(computedAngleBeforeShift) + startX - 16;
                var gameY = $scope.maxArrowDistance * Math.sin(computedAngleBeforeShift) + startY - 32;
                distance = $scope.maxArrowDistance;
                //arrow.firebase = firebaseRef;
                $log.log("Firebase: " + angular.toJson(firebaseRef.key()));
                var time = Math.round(1000 * distance / $scope.arrowSpeed);

                $log.log("Moving to : " + gameX + "," + gameY + " in " + time + " ms");
                arrow.tween({x: gameX, y: gameY}, time).bind("TweenEnd", function () {
//                    $log.log("x: "+arrow.x+" y: "+arrow.y);
//                    this.firebaseRemove();
                    $log.log("uuid of arrow: " + angular.toJson(arrow.uuid));
                    if ($scope.arrows[arrow.uuid]) {
                        $scope.arrows[arrow.uuid].remove();
                    }
                    this.destroy();
                });
            }

            $scope.addPlayer = function (playerObj) {
                if ($scope.otherPlayers[playerObj.player]) {
                    return;
                }
                $log.log("adding new player: " + playerObj.player);
                var otherPlayer = Crafty.e("Hero, knight, Tween, SpriteAnimation, CharAnims, MouseFace, moveable, canBeHit").attr({x: playerObj.x, y: playerObj.y}).CharAnims($scope.animations.knight);
                otherPlayer.canBeHit();
                var playerText = Crafty.e("2D, Canvas, Text").text(playerObj.player).attr({x: playerObj.x + 48, y: playerObj.y});
                otherPlayer.attach(playerText);
                $scope.otherPlayers[playerObj.player] = otherPlayer;
            }
        });
