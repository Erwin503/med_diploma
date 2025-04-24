import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as employeeController from "../controllers/employeeDetailsController";

const router = express.Router();

// Публичные
router.get("/", employeeController.getAllEmployees);
router.get("/:id/details", employeeController.getEmployeeDetailsById);

// Всё, что дальше — только для авторизованных
router.use(authenticateToken);

// Личный профиль
router.get("/details", employeeController.getEmployeeDetails);
router.post("/details", employeeController.addEmployeeDetails);
router.put("/details", employeeController.updateEmployeeDetails);
router.delete("/details", employeeController.deleteEmployeeDetails);

// Управление деталями по ID (для админов или себя)
router.put("/:id/details", employeeController.updateEmployeeDetails);
router.delete("/:id/details", employeeController.deleteEmployeeDetails);

export default router;
