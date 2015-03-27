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
        .controller('MainCtrl', function ($scope, $log) {
            $scope.directionList = ["e", "n", "ne", "nw", "s", "se", "sw", "w"];
            $scope.lumberjackDirection = $scope.directionList[0];
            $scope.width = 800;
            $scope.height = 800;
            $scope.heroWidth = 96;
            $scope.heroHeight = 96;
            $scope.speed = 90; //px/s
            $scope.firebaseUrl = '//amber-fire-8177.firebaseIO.com/';

            $scope.animations = {knight: [{action: "walk", startRow: 16, numFrames: 8, animSpeed: 800}]};
            $scope.username;
            $scope.firebase;
            $scope.otherPlayers = {};
            $scope.thisFirebasePlayer = null;




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
                $scope.player2 = Crafty.e("Hero, knight, Tween, SpriteAnimation, CharAnims, MouseFace, moveable").attr({x: $scope.startX, y: $scope.startY})
                        .bind("MouseDown", function (data) {
                            //$log.log("mouse click: " + angular.toJson(data));
                            $log.log("Current position: " + this.x + "," + this.y);
                            if (data.mouseButton == Crafty.mouseButtons.LEFT) {
                                var start = {x: this.x, y: this.y};
                                var end = {x: data.realX, y: data.realY};
                                this.move(end);
                                $scope.thisFirebasePlayer.update({action: {end: end}});
                            }





                        }).CharAnims($scope.animations.knight);
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
                Crafty.c('moveable', {move: function (end) {
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
                        if (angle >= 0 && angle < 22.5) {
                            action = "walk_e"
                        } else if (angle >= 22.5 && angle < 67.5) {
                            action = "walk_se";
                        } else if (angle >= 67.5 && angle < 112.5) {
                            action = "walk_s";
                        } else if (angle >= 112.5 && angle < 157.5) {
                            action = "walk_sw";
                        } else if (angle >= 157.5 && angle < 202.5) {
                            action = "walk_w";
                        } else if (angle >= 202.5 && angle < 247.5) {
                            action = "walk_nw";
                        } else if (angle >= 247.5 && angle < 292.5) {
                            action = "walk_n";
                        } else if (angle >= 292.5 && angle < 337.5) {
                            action = "walk_ne";
                        } else {
                            action = "walk_e";
                        }
                        this.destX = end.x;
                        this.destY = end.y;
                        this.animate(action, -1);
                    }});

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
                            $scope.addPlayer(currentUsers[key]);
                        }

                    }
                }, function (err) {
                    $log.log("The read failed: " + err.code + ": obj: " + angular.toJson(err));
                });

                $scope.firebase.on("child_added", function (snapshot) {
                    var value = snapshot.val();
                    if (value.player !== $scope.username) {
                        $scope.addPlayer(value);
                    }
                });

                $scope.firebase.on("child_changed", function (snapshot) {
                    var value = snapshot.val();

                    $log.log("child changed called, new value: " + angular.toJson(value));
                    if (value.player !== $scope.username) {
                        if (value.action.end.x !== $scope.otherPlayers[value.player].destX &&
                                value.action.end.y !== $scope.otherPlayers[value.player].destY) {
                            $scope.otherPlayers[value.player].move(value.action.end);
                        }
                    }
                });

                $scope.firebase.on("child_removed", function (snapshot) {
                    var value = snapshot.val();
                    $scope.otherPlayers[value.player].destroy();
                });
            }

            $scope.addPlayer = function (playerObj) {
                if($scope.otherPlayers[playerObj.player]){
                    return;
                }
                $log.log("adding new player: "+playerObj.player);
                var otherPlayer = Crafty.e("Hero, knight, Tween, SpriteAnimation, CharAnims, MouseFace, moveable").attr({x: playerObj.x, y: playerObj.y}).CharAnims($scope.animations.knight);
                var playerText = Crafty.e("2D, Canvas, Text").text(playerObj.player).attr({x: playerObj.x + 48, y: playerObj.y});
                otherPlayer.attach(playerText);
                $scope.otherPlayers[playerObj.player] = otherPlayer;
            }
        });
