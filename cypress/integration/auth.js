
describe('Authentication', () => {

    beforeEach(()=> {
        Cypress.env("loginU", "test");
        Cypress.env("loginP", "test");
    })

    it("Cant login with wrong credentials", () => {
        cy.request('POST', "/auth/login", {"username": "qwert", "password": "qwert"})
        .then((response) => {expect(response.body).to.have.property('error', true)})
        .its('status').should('eq', 200);
    });

    it("Can create a user", () => {
        cy.request('POST', "/auth/register", {
            "username": Cypress.env("loginU"),
            "password": Cypress.env("loginP"),
            "passwordRepeat": Cypress.env("loginP")
        })
        .then((response) => {
            expect(response.body).to.have.property('error', false)
            return response;
        })
        .its('status').should('eq', 200);
    });

    it("Can login with new credentials", () => {
         cy.request('POST', "/auth/login", {
             "username" : Cypress.env("loginU"),
             "password" : Cypress.env("loginP")
         }).then((response) => {
            expect(response.body).to.have.property('error', false);
            Cypress.env('rtoken', response.body.refreshToken); 
         }).its('status').should('eq', 200);
    });

    it("Cant use an invalid refreshToken", () => {
        cy.request('POST', "/auth/accessToken", {
            "refreshToken": "some-invalid-token",
        }).then((response) => {expect(response.body).to.have.property('error', true)})
        .its('status').should('eq', 200);
    });

    it("Can use a valid refreshToken", () => {
        cy.request('POST', "/auth/accessToken", {
            "refreshToken": Cypress.env('rtoken') 
        })
        .as("validRT")
        .then((response) => {expect(response.body).to.have.property('error', false)})
        .its('status').should('eq', 200);
    });
});