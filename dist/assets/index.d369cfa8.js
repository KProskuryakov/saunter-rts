import{P as n}from"./vendor.c2cc9365.js";const l=function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const i of t.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function o(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerpolicy&&(t.referrerPolicy=e.referrerpolicy),e.crossorigin==="use-credentials"?t.credentials="include":e.crossorigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=o(e);fetch(e.href,t)}};l();const c=function(){this.load.setBaseURL("http://labs.phaser.io"),this.load.image("sky","assets/skies/space3.png"),this.load.image("logo","assets/sprites/phaser3-logo.png"),this.load.image("red","assets/particles/red.png")},d=function(){this.add.image(400,300,"sky");var r=this.add.particles("red"),o=r.createEmitter({speed:100,scale:{start:1,end:0},blendMode:"ADD"}),s=this.physics.add.image(400,100,"logo");s.setVelocity(100,200),s.setBounce(1,1),s.setCollideWorldBounds(!0),o.startFollow(s)},u={type:n.AUTO,width:800,height:600,physics:{default:"arcade",arcade:{gravity:{y:200}}},scene:{preload:c,create:d}};new n.Game(u);
