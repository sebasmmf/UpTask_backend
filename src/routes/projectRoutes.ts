import { Router } from "express"
import { body, param } from "express-validator"
import { handleInputsErrors } from "../middleware/validation"
import { ProjectController } from "../controllers/ProjectController"
import { TaskController } from "../controllers/TaskController"
import { projectExist } from "../middleware/project"
import { hasAuthorization, taskBelongToProject, taskExists } from "../middleware/task"
import { authenticate } from "../middleware/auth"
import { TeamMemberController } from "../controllers/TeamController"
import { NoteController } from "../controllers/NoteController"

const router = Router()

router.use(authenticate)

router.post('/',
    body('projectName')
        .notEmpty().withMessage('El Nombre del Proyecto es Obligatorio'),
    body('clientName')
        .notEmpty().withMessage('El Nombre del Cliente es Obligatorio'),
    body('description')
        .notEmpty().withMessage('La Descripción del Proyecto es Obligatoria'),
    handleInputsErrors,
    ProjectController.createProject
)

router.get('/', ProjectController.getAllProjects)

router.get('/:id',
    param('id').isMongoId().withMessage('ID no válido'),
    handleInputsErrors,
    ProjectController.getProjectById
)

/** Routes for tasks  */
router.param('projectId', projectExist)

router.put('/:projectId',
    param('projectId').isMongoId().withMessage('ID no válido'),
    body('projectName')
        .notEmpty().withMessage('El Nombre del Proyecto es Obligatorio'),
    body('clientName')
        .notEmpty().withMessage('El Nombre del Cliente es Obligatorio'),
    body('description')
        .notEmpty().withMessage('La Descripción del Proyecto es Obligatoria'),
    handleInputsErrors,
    hasAuthorization,
    ProjectController.updateProject
)

router.delete('/:projectId',
    param('projectId').isMongoId().withMessage('ID no válido'),
    handleInputsErrors,
    hasAuthorization,
    ProjectController.deleteProject
)

router.post('/:projectId/tasks',
    body('name')
        .notEmpty().withMessage('El Nombre de la tarea es obligatoria'),
    body('description')
        .notEmpty().withMessage('La descripción de la tarea es obligatoria'),
    handleInputsErrors,
    TaskController.createTask
)

router.get('/:projectId/tasks',
    TaskController.getProjectTasks
)

router.param('taskId', taskExists)
router.param('taskId', taskBelongToProject)

router.get('/:projectId/tasks/:taskId',
    param('taskId').isMongoId().withMessage('ID no válido'),
    handleInputsErrors,
    TaskController.getTaskById
)

router.put('/:projectId/tasks/:taskId',
    hasAuthorization,
    param('taskId').isMongoId().withMessage('ID no válido'),
    body('name')
        .notEmpty().withMessage('El Nombre de la tarea es obligatoria'),
    body('description')
        .notEmpty().withMessage('La descripción de la tarea es obligatoria'),
    handleInputsErrors,
    TaskController.updateTask
)

router.delete('/:projectId/tasks/:taskId',
    hasAuthorization,
    param('taskId').isMongoId().withMessage('ID no válido'),
    handleInputsErrors,
    TaskController.deleteTask
)

router.post('/:projectId/tasks/:taskId/status',
    hasAuthorization,
    param('taskId').isMongoId().withMessage('ID no válido'),
    body('status')
        .notEmpty().withMessage('El estado es obligatorio'),
    handleInputsErrors,
    TaskController.updateStatus
)

/** Routes for teams */
router.post('/:projectId/team/find',
    body('email')
        .isEmail().toLowerCase().withMessage('E-mail no válido'),
    handleInputsErrors,
    TeamMemberController.findMemberByEmail
)

router.get('/:projectId/team',
    TeamMemberController.getProjectTeam
)

router.post('/:projectId/team',
    body('id')
        .isMongoId().withMessage('ID No Válido'),
    handleInputsErrors,
    TeamMemberController.addMemberById
)

router.delete('/:projectId/team/:userId',
    param('userId')
        .isMongoId().withMessage('ID No Válido'),
    handleInputsErrors,
    TeamMemberController.removeMemberById
)

/** Routes for Notes */
router.post('/:projectId/tasks/:taskId/notes',
    body('content')
        .notEmpty().withMessage('El contenido de la nota es obligatorio'),
    handleInputsErrors,
    NoteController.createNote
)

router.get('/:projectId/tasks/:taskId/notes',
    NoteController.getTaskNotes
)

router.delete('/:projectId/tasks/:taskId/notes/:noteId',
    param('noteId')
        .isMongoId().withMessage('ID no válido'),
    handleInputsErrors,
    NoteController.deleteNote
)

export default router