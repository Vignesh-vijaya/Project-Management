export const protect=async (req, res, next) => {
    try {
        const { userId } = req.auth; // Assuming req.auth is populated by Clerk middleware

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ error: "Internal server error" });
    }
};