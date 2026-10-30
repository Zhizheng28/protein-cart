from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
PROFILE = {"weight_lb": 170, "goal": "gain", "budget_cents": 9000, "store_id": "kroger"}


def test_health() -> None:
    body = client.get("/api/health").json()
    assert body["status"] == "ok"


def test_catalog() -> None:
    body = client.get("/api/catalog").json()
    assert len(body["meals"]) == 18
    assert body["bowl_price_cents"] == 1350


def test_plan_returns_priced_week() -> None:
    body = client.post("/api/plan", json=PROFILE).json()
    assert len(body["days"]) == 7
    assert body["target_g"] == 120
    money = body["evaluation"]["money"]
    assert money["takeout_cents"] == 18900
    assert money["grocery_cents"] == sum(i["cost_cents"] for i in body["evaluation"]["items"])
    assert body["evaluation"]["price_source"]["is_sample"] is True


def test_evaluate_rejects_wrong_slot() -> None:
    days = [["chicken_burrito_bowl", "tuna_melt", "beef_ragu"]] * 7
    response = client.post("/api/plan/evaluate", json={**PROFILE, "days": days})
    assert response.status_code == 422


def test_evaluate_reprices_edit() -> None:
    days = [["yogurt_oat_bowl", "tuna_melt", "beef_ragu"]] * 7
    body = client.post("/api/plan/evaluate", json={**PROFILE, "days": days}).json()
    assert body["money"]["grocery_cents"] > 0


def test_quick_meals_sorted_in_cart_first() -> None:
    body = client.get("/api/quick-meals", params={"in_cart": "tuna,bread,cheese"}).json()
    assert body["meals"][0]["id"] == "tuna_melt"
    assert all(meal["minutes"] <= 15 for meal in body["meals"])


def test_unknown_api_path_is_json_404() -> None:
    assert client.get("/api/nope").status_code == 404
