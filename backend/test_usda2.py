import asyncio
import httpx

async def main():
    api_key = "DEMO_KEY"
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    
    # Let's test with just one dataType
    params1 = {
        "query": "rice",
        "pageSize": 1,
        "dataType": "Foundation",
        "api_key": api_key,
    }

    # Test what the app is currently using in usda_client.py
    params2 = {
        "query": "1.0 cup Mixed greens (lettuce)",
        "pageSize": 1,
        "dataType": ["Branded", "Foundation", "SR Legacy", "Survey (FNDDS)"],
        "api_key": api_key,
    }

    async with httpx.AsyncClient() as client:
        print("Test 1 (single dataType):")
        resp1 = await client.get(url, params=params1)
        print(resp1.status_code, resp1.text[:200])
        
        print("\nTest 2 (array from code):")
        resp2 = await client.get(url, params=params2)
        print(resp2.status_code, resp2.text[:200])

asyncio.run(main())
