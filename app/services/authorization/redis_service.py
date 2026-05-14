from extensions import redis_client, supabase


class redis_service:
    def __init__(self):
        self.redis_client = redis_client

    def addSessionToCache(self, user_id: str) -> bool:
        result = self.redis_client.set(
            f"2fa:{user_id}",
            "pending",
            ex=300
        )
        return result
    

    def get_user(self, user_id: str):
        return self.redis_client.get(f"user:{user_id}")