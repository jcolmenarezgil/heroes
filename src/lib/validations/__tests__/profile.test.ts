import { describe, it, expect } from "vitest";
import { profileSchema } from "../profile";

describe("Profile Validation Schema", () => {
    it("should validate a valid profile payload", () => {
        const validData = {
            name: "Jose Colmenarez",
            status: "active",
            last_known_location: "Caracas, Venezuela",
            phoneNumbers: ["+12025550143"],
        };

        const result = profileSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it("should reject when name is empty or missing", () => {
        const invalidData = {
            name: "",
            status: "active",
            last_known_location: "Caracas, Venezuela",
        };

        const result = profileSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});