import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ReservaForm from "../src/components/ReservaForm.js";
import TurnosList from "../src/components/TurnosList.js";
import { api } from "../src/services/api.js";
import type { Profesional, Servicio, TurnoDetalle } from "../src/types/index.js";

vi.mock("../src/services/api.js", () => ({
  api: {
    servicios: vi.fn(),
    profesionales: vi.fn(),
    reservar: vi.fn(),
    turnos: vi.fn(),
    cancelarTurno: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

const servicios: Servicio[] = [
  { id: "s1", nombre: "Corte", duracionMinutos: 30, precio: 15, activo: true },
  { id: "s2", nombre: "Barba", duracionMinutos: 20, precio: 10, activo: true },
];

const profesionales: Profesional[] = [
  { id: "p1", nombre: "Carlos", email: "c@x.com", especialidad: "Barbero", activo: true },
];

function turno(overrides: Partial<TurnoDetalle>): TurnoDetalle {
  return {
    id: "t1",
    clienteId: "c1",
    profesionalId: "p1",
    servicioId: "s1",
    fecha: "2026-10-02",
    horaInicio: "18:00",
    horaFin: "18:30",
    estado: "CONFIRMADO",
    cliente: { id: "c1", nombre: "Martina", email: "m@x.com" },
    profesional: { id: "p1", nombre: "Carlos" },
    servicio: { id: "s1", nombre: "Corte", precio: 15 },
    ...overrides,
  };
}

beforeEach(() => {
  mockApi.servicios.mockResolvedValue(servicios);
  mockApi.profesionales.mockResolvedValue(profesionales);
  mockApi.reservar.mockResolvedValue({} as never);
  mockApi.cancelarTurno.mockResolvedValue({} as never);
});

describe("ReservaForm", () => {
  it("rechaza una fecha anterior a hoy sin llamar a la API", async () => {
    const onReservado = vi.fn();
    render(<ReservaForm clienteId="c1" onReservado={onReservado} />);
    expect(await screen.findByText(/Corte/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Servicio"), { target: { value: "s1" } });
    fireEvent.change(screen.getByLabelText("Profesional"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2020-01-01" } });
    fireEvent.change(screen.getByLabelText("Hora"), { target: { value: "10:00" } });

    const form = screen.getByRole("button", { name: "Confirmar reserva" }).closest("form")!;
    fireEvent.submit(form);

    expect(await screen.findByText(/no puede ser anterior a hoy/i)).toBeInTheDocument();
    expect(mockApi.reservar).not.toHaveBeenCalled();
    expect(onReservado).not.toHaveBeenCalled();
  });

  it("reserva un turno válido y avisa al padre", async () => {
    const onReservado = vi.fn();
    mockApi.reservar.mockResolvedValue(turno({}));
    render(<ReservaForm clienteId="c1" onReservado={onReservado} />);
    expect(await screen.findByText(/Corte/)).toBeInTheDocument();

    const hoy = new Date().toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText("Servicio"), { target: { value: "s1" } });
    fireEvent.change(screen.getByLabelText("Profesional"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: hoy } });
    fireEvent.change(screen.getByLabelText("Hora"), { target: { value: "10:00" } });

    const form = screen.getByRole("button", { name: "Confirmar reserva" }).closest("form")!;
    fireEvent.submit(form);

    expect(await screen.findByText(/Turno reservado/i)).toBeInTheDocument();
    expect(onReservado).toHaveBeenCalledTimes(1);
  });

  it("traduce el error de superposición del backend a un mensaje claro", async () => {
    mockApi.reservar.mockRejectedValue(new Error("Superposición de turnos: el profesional ya tiene uno en ese horario"));
    render(<ReservaForm clienteId="c1" onReservado={vi.fn()} />);
    expect(await screen.findByText(/Corte/)).toBeInTheDocument();

    const hoy = new Date().toISOString().slice(0, 10);
    fireEvent.change(screen.getByLabelText("Servicio"), { target: { value: "s1" } });
    fireEvent.change(screen.getByLabelText("Profesional"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: hoy } });
    fireEvent.change(screen.getByLabelText("Hora"), { target: { value: "10:00" } });

    const form = screen.getByRole("button", { name: "Confirmar reserva" }).closest("form")!;
    fireEvent.submit(form);

    expect(await screen.findByText(/Ya existe un turno en esa franja/i)).toBeInTheDocument();
  });
});

describe("TurnosList", () => {
  it("muestra solo los turnos del cliente actual", async () => {
    mockApi.turnos.mockResolvedValue([
      turno({}),
      turno({
        id: "t2",
        clienteId: "otra",
        servicio: { id: "s2", nombre: "Barba", precio: 10 },
      }),
    ]);
    render(<TurnosList clienteId="c1" />);
    expect(await screen.findByText(/Corte/)).toBeInTheDocument();
    expect(screen.queryByText(/Barba/)).not.toBeInTheDocument();
  });

  it("no ofrece cancelar para un turno en estado terminal", async () => {
    mockApi.turnos.mockResolvedValue([turno({ estado: "CANCELADO" })]);
    render(<TurnosList clienteId="c1" />);
    expect(await screen.findByText(/Corte/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("cancela el turno solo tras confirmar", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockApi.turnos.mockResolvedValue([turno({})]);
    mockApi.cancelarTurno.mockResolvedValue(turno({ estado: "CANCELADO" }));
    render(<TurnosList clienteId="c1" />);

    const boton = await screen.findByRole("button", { name: "Cancelar" });
    fireEvent.click(boton);

    expect(confirm).toHaveBeenCalledWith("¿Cancelar este turno?");
    expect(mockApi.cancelarTurno).toHaveBeenCalledWith("t1");
    confirm.mockRestore();
  });
});
