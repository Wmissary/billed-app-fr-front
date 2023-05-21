/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";

import router from "../app/Router.js";

jest.mock("../app/Store.js", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      }),
    );
    jest.spyOn(mockStore, "bills");
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });
  describe("When I am on NewBill Page", () => {
    test("Then newBill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const windowIcon = screen.getByTestId("icon-mail");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
  });
  describe("When I am on NewBill Page and I click on the submit button", () => {
    test("Then the bill should be added to bills page", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("form-new-bill"));

      const type = screen.getByTestId("expense-type");
      const name = screen.getByTestId("expense-name");
      const date = screen.getByTestId("datepicker");
      const amount = screen.getByTestId("amount");
      const vat = screen.getByTestId("vat");
      const pct = screen.getByTestId("pct");
      const commentary = screen.getByTestId("commentary");
      const file = screen.getByTestId("file");
      const submitButton = screen.getByTestId("form-new-bill");

      type.value = "Transports";
      name.value = "test";
      date.value = "2021-09-01";
      amount.value = "100";
      vat.value = "10";
      pct.value = "50";
      commentary.value = "test";
      fireEvent.change(file, {
        target: {
          files: [new File(["test"], "test.png", { type: "image/png" })],
        },
      });

      fireEvent.submit(submitButton);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const tBody = screen.getByTestId("tbody");
      expect(tBody).toBeTruthy();
      expect(mockStore.bills).toHaveBeenCalled();
    });
    describe("If there is an API Post error", () => {
      test("fails with 404 message error", async () => {
        const mockCreate = jest.fn().mockRejectedValueOnce(new Error("Erreur 404"));
        mockStore.bills.create = mockCreate;
        const html = NewBillUI();
        document.body.innerHTML = html;
        const newBill = new NewBill({
          document,
          onNavigate: () => {},
          store: mockStore,
          localStorage: window.localStorage,
        });
        const handleSubmit = jest.fn(newBill.handleSubmit);
        const submitButton = screen.getByTestId("form-new-bill");
        submitButton.addEventListener("submit", handleSubmit);
        fireEvent.submit(submitButton);
        expect(handleSubmit).toThrowError();
      });

      test("fails with 500 message error", async () => {
        const mockCreate = jest.fn().mockRejectedValueOnce(new Error("Erreur 500"));
        mockStore.bills.create = mockCreate;
        const html = NewBillUI();
        document.body.innerHTML = html;
        const newBill = new NewBill({
          document,
          onNavigate: () => {},
          store: mockStore,
          localStorage: window.localStorage,
        });
        const handleSubmit = jest.fn(newBill.handleSubmit);
        const submitButton = screen.getByTestId("form-new-bill");
        submitButton.addEventListener("submit", handleSubmit);
        fireEvent.submit(submitButton);
        expect(handleSubmit).toThrowError();
      });
    });
  });
});

describe("NewBill unit tests", () => {
  describe("handleChangeFile", () => {
    test("should change file with valid file type", () => {
      document.body.innerHTML = NewBillUI({});
      const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["image.png"], "image.png", { type: "image/png" })],
        },
      });

      expect(handleChangeFile).toBeCalled();
      expect(inputFile.files[0].name).toBe("image.png");
    });
    test("should not change file with invalid file type", () => {
      document.body.innerHTML = NewBillUI({});
      const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      const errorAlertSpy = jest.spyOn(window, "alert").mockImplementation();
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["text.pdf"], "text.pdf", { type: "text/pdf" })],
        },
      });

      expect(handleChangeFile).toBeCalled();
      expect(errorAlertSpy).toHaveBeenCalledTimes(1);
      expect(errorAlertSpy).toHaveBeenCalledWith("Type de fichier non valide (jpeg ou png uniquement)");
      expect(inputFile.value).toBe("");
    });
  });
  test("handleSubmit", () => {
    document.body.innerHTML = NewBillUI({});
    const onNavigate = pathname => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const newBill = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    const handleSubmit = jest.fn(() => newBill.handleSubmit);
    const submitButton = screen.getByTestId("form-new-bill");
    submitButton.addEventListener("submit", handleSubmit);
    fireEvent.submit(submitButton);

    expect(handleSubmit).toBeCalled();
  });
});
