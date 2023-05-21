/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";

jest.mock("../app/Store.js", () => mockStore);
describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    }),
  );

  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then bills should be retrieved from API", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const tBody = screen.getByTestId("tbody");
      expect(tBody.children.length).toBe(4);
    });

    describe("If there is an API error", () => {
      test("fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });

    test("Then bills should be ordered from earliest to latest", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  describe("When I click on new bill button", () => {
    test("Then it should display new bill page", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const newBillButton = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillButton);
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
  describe("When I click on an eye icon", () => {
    test("Then it should display modal", async () => {
      $.fn.modal = jest.fn();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      fireEvent.click(eyeIcon);
      expect(screen.getByText("Justificatif")).toBeTruthy();
    });
  });
});

describe("Bill container unit test", () => {
  describe("handleClickNewBill", () => {
    test("should call onNavigate", () => {
      const onNavigate = jest.fn();
      const bill = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      bill.handleClickNewBill();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
    });
  });
  describe("handleClickIconEye", () => {
    test("should open modal with correct URL", () => {
      const mockIcon = document.createElement("div");
      mockIcon.setAttribute("data-bill-url", "http://example.com/bill.jpg");
      document.body.appendChild(mockIcon);
      const bills = new Bills({ document });
      bills.handleClickIconEye(mockIcon);
      const modal = document.querySelector("#modaleFile");
      expect(modal).toBeTruthy();
      expect(modal.querySelector("img").src).toBe("http://example.com/bill.jpg");
    });
  });
  describe("getBills", () => {
    test("should return bills from API", async () => {
      const bills = new Bills({ document, store: mockStore });
      const billsList = await bills.getBills();
      expect(billsList.length).toBe(4);
    });
  });
});
