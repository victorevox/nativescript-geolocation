var Geolocation = require("nativescript-geolocation").Geolocation;
var geolocation = new Geolocation();

describe("greet function", function() {
    it("exists", function() {
        expect(geolocation.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(geolocation.greet()).toEqual("Hello, NS");
    });
});