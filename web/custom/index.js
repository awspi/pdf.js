import {setup} from "./setup.js";
import {AnnotationEditorController} from "./annotation-editor-controller.js";
import {EditorManager} from "./editor-manager.js";

window.annotationEditorController = new AnnotationEditorController();
window.editorManager =new EditorManager();

export const setupCustomCapabilities=setup
