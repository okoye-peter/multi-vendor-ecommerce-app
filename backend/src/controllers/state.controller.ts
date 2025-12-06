import prisma from "../libs/prisma.js";
import { type RequestHandler } from "express";


export const getCountries: RequestHandler = async(req, res, next) => {
    try {
        const  countries = await prisma.country.findMany({
            select: {
                id: true,
                name: true
            }
        });

        return res.status(200).json(countries);
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}

export const getCountryStates: RequestHandler = async (req, res, next) => {
    try {
        const countryId = Number(req.params.countryId);
        if(isNaN(countryId))
            throw {status: 400, message: "country not found"};

        const  states = await prisma.state.findMany({
            where:{ countryId },
            select: {
                id: true,
                name: true,
                countryId: true
            }
        });

        return res.status(200).json(states);
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}

export const getStateLgas: RequestHandler = async (req, res, next) => {
    try {
        const stateId = Number(req.params.stateId);
        if(isNaN(stateId))
            throw {status: 400, message: "state not found"};

        const  states = await prisma.lGA.findMany({
            where:{ stateId },
            select: {
                id: true,
                name: true,
                stateId: true
            }
        });

        return res.status(200).json(states);
    } catch (error) {
        if (error instanceof Error) {
            next({ message: error.message, status: 500 });
        } else if (typeof error === "object" && error !== null && "status" in (error as Record<string, any>)) {
            throw error;
        } else {
            next({ message: "Server Error", status: 500 });
        }
    }
}