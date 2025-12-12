"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessStoriesModule = void 0;
const common_1 = require("@nestjs/common");
const success_stories_service_1 = require("./success-stories.service");
const success_stories_controller_1 = require("./success-stories.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const upload_module_1 = require("../upload/upload.module");
let SuccessStoriesModule = class SuccessStoriesModule {
};
exports.SuccessStoriesModule = SuccessStoriesModule;
exports.SuccessStoriesModule = SuccessStoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, upload_module_1.UploadModule],
        controllers: [success_stories_controller_1.SuccessStoriesController],
        providers: [success_stories_service_1.SuccessStoriesService],
        exports: [success_stories_service_1.SuccessStoriesService],
    })
], SuccessStoriesModule);
//# sourceMappingURL=success-stories.module.js.map