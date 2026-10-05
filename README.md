# Barber Appointment Hub

MVP — Sistema de Turnos para Barbería

1. Objetivo del MVP

Desarrollar una aplicación web para gestionar los turnos de una barbería, permitiendo a los clientes consultar servicios, registrarse, iniciar sesión, seleccionar un servicio, fecha y hora, reservar y cancelar turnos.

El administrador podrá gestionar los servicios, horarios de atención, bloqueos y turnos, además de consultar un dashboard con información general.

El MVP funcionará sin backend y sin base de datos real. Toda la información será manejada mediante datos mockup almacenados en localStorage, permitiendo simular el comportamiento de una aplicación real.                                                                                                 . Roles del sistema

El sistema tendrá únicamente dos roles.

Cliente

Puede:

 Registrarse.

 Iniciar sesión.

 Cerrar sesión.

 Consultar servicios.

 Consultar horarios.

 Reservar un turno.

 Consultar sus turnos.

 Cancelar sus turnos.

 Utilizar Turno Express.

Administrador

Puede:

 Iniciar sesión.

 Consultar dashboard.

 Gestionar turnos.

 Cambiar estados de turnos.

 Cancelar turnos.

 Gestionar servicios.

 Activar/desactivar servicios.

 Gestionar horarios.

 Crear bloqueos.

 Eliminar bloqueos.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quick-cut-scheduling.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d07a1649-517c-42c3-891b-6feaad8b2308).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
