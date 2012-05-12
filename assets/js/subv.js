/*
 * Subv: //github.com/gdd/subv
 * Copyright (C) 2012 Md Gao
 * Licensed under the MIT License
 */

"use strict";

window.subv = {
	currentPage: -1,
	init: function() {
		window.doT.templateSettings.strip = false;
		subv.bindEvents();
		subv.clearList();
		subv.loadNextList();
		subv.applySettings();
	},
	log: function(context) {
		if ( !window.console || !window.console.log ) {
			return false;
		}
		if (typeof context === "object") {
			console.log(context);
		} else {
			console.log("LOG: " + context);
		}
	},
	applySettings: function() {
		var val;
		val = amplify.store("width-splitter-value");
		if (val) {
			$("#width-splitter").val(val).trigger("change");
		}
		val = amplify.store("width-adjuster-value");
		if (val) {
			$("#width-adjuster").val(val).trigger("change");
		}
	},
	loadNextList: function() {
		subv.currentPage++;
		subv.api.v2ex.getItems(subv.currentPage, function(items) {
			for (var i = 0; i < items.length; i++) {
				var t = (doT.template($("#item-template").text()))(items[i]);
				if (subv.item.isBanned(items[i].id)) {
					$("#banned").append(t);
				} else if (subv.item.isRead(items[i].id, items[i].comments_count)) {
					$("#read").append(t);
				} else {
					$("#latest").append(t);
				}
			}
			// update the #read/#banned counter
			$("#read-items-counter").text($("#read > .item").length);
			$("#banned-items-counter").text($("#banned > .item").length);
		});
	},
	clearList: function() {
		$("#latest").html("");
		$("#read").hide().html("");
		$("#banned").hide().html("");
		$("#item").html("");
	},
	refreshList: function() {
		subv.clearList();
		subv.currentPage = -1;
		subv.loadNextList();
	},
	item: {
		markRead: function(id, comments) {
				amplify.store("read-"+id+"-"+comments, "true");
		},
		markUnRead: function(id, comments) {
				amplify.store("read-"+id+"-"+comments, "false");
		},
		isRead: function(id, comments) {
				if (amplify.store("read-"+id+"-"+comments) === "true") {
						return true;
				}
				return false;
		},
		markBan: function(id) {
				amplify.store("ban-"+id, "true");
		},
		markUnban: function(id) {
				amplify.store("ban-"+id, "false");
		},
		isBanned: function(id) {
				if (amplify.store("ban-"+id) === "true") {
						return true;
				}
				return false;
		},
		expand: function(id) {
			subv.log("subv.item.expand(" + id + ")");
		
			var $item = $("[id^=item-" + id + "-]");
			if ($item.hasClass("cached")) {
				// expand item directly if it's expanded once
				subv.log("cached, expand directly [DO NOTHING CURRENTLY]");
				return;
			} else {
				$item.addClass("cached");
			}
			$(".item.expand").removeClass("expand");
			$item.addClass("expand");
		
			$("#item").empty();
			var $view = $("<div/>")
				.append($item.find(".item-comments").clone())
				.appendTo("#item");
			var $loading = $view.find(".js-loading").show();
		
			subv.api.v2ex.getItem(id, null, function(item) {
				subv.log(item);
				// op
				var $op = $view.find(".op");
				var template = $("#comment-item-template").text();
				var t = ( doT.template(template) )(item.comments[0]);
				$op.append(t);
				// comments
				for (var i = 1; i <= item.pages; i++) {
					$view.addClass("haspage-" + i);
				}
				var $page = $view.find(".page-" + item.current_page).empty();
				for (var i = 1; i < item.comments.length; i++) {
					var template = $("#comment-item-template").text();
					var t = ( doT.template(template) )(item.comments[i]);
					$page.append(t);
				}
				$loading.hide();
		
				subv.log("marking "+id+"-"+item.comments_count+" as read");
				subv.item.markRead(id, item.comments_count);
			});
		},
		collapse: function(id) {
		}
	},
	items: {
		markAllAsRead: function() {
			$("#latest .item").each(function() {
				var id = $(this).attr("id").split("-")[1];
				var comments = $(this).attr("id").split("-")[2];
				subv.item.markRead(id, comments);
			});
			subv.refreshList();
		},
		markAllAsBanned: function() {
			$("#latest .item").each(function() {
				var id = $(this).attr("id").split("-")[1];
				var comments = $(this).attr("id").split("-")[2];
				if (!item.isRead(id, comments)) {
					subv.log("Banning " + id);
					subv.item.markBan(id);
				}
			});
			subv.refreshList();
		}
	},
	bindEvents: function() {
		$(document).on("click", "a", function(e) {
			e.preventDefault();
		});

		$("#btn-read-all").on("click", function() {
			subv.items.markAllAsRead();
		});

		$("#btn-ban-all").on("click", function() {
			subv.items.markAllAsBanned()
		});

		$("#logo, #btn-reload").on("click", function() {
			subv.refreshList();
		});

		$("#more"/* <button/> */).on("click", function() {
			subv.loadNextList();
		});

		$("#read-items-toggle").on("click", function() {
			$("#read").slideToggle();
		});

		$("#banned-items-toggle").on("click", function() {
			$("#banned").slideToggle();
		});

		/* unused
		$("#search-form").on("submit", function(e) {
			e.preventDefault();
			var url = "https://www.google.com/search?q=site%3Av2ex.com%2Ft+";
			var keywords = $(this).find("input").val();
			window.open(url + keywords)
		});
		*/

		$(document).on("click", ".item-heading .title a, .item-meta .comments-count a", function(e) {
			var id = $(this).closest(".item").attr("id").split("-")[1];
			subv.log("clicked item id: " + id);
			subv.item.expand(id);
		});

		$(document).on("submit", ".comment-form", function(e) {
			e.preventDefault();
			var id = $(this).attr("action").split("/").pop();
			subv.log("COMMENT FUNCTION DISABLED");
			return false;
			$.ajax({
				"url": $(this).attr("action"),
				"type": "POST",
				"data": $(this).serialize(),
				"success": function() {
					subv.log("POST to " + id + " success!");
				}
			});
		});

		$("#width-splitter").on("change", function() {
			var val = $(this).val();
			amplify.store("width-splitter-value", val);
			$("#items").css({
				"width": val + "%"
			});
			$("#item").css({
				"width": (100-val) + "%"
			});
		});

		$("#width-adjuster").on("change", function() {
			var val = $(this).val();
			amplify.store("width-adjuster-value", val);
			setTimeout(function() {
				$("#wrapper").css({
					"margin-left": val+"%",
					"margin-right": val+"%"
				});
			}, 1000);
		});

		$(document).on("click", ".js-show-comment-box", function() {
			$(this).next().show();
			$(this).remove();
		});

		$(document).on("click", ".js-load-page", function() {
			var page = $(this).parent().attr("class").split("-").pop();
			subv.log("loading page " + page);
		});
	},
};

$(subv.init);

