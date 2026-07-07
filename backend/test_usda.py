import asyncio
import httpx

async def main():
    api_key = "DEMO_KEY" # Using DEMO_KEY for test
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    
    # Test 1: array dataType
    params1 = {
        "query": "rice",
        "pageSize": 1,
        "dataType": ["Branded", "Foundation", "SR Legacy", "Survey (FNDDS)"],
        "api_key": api_key,
    }
    
    # Test 2: comma-separated dataType
    params2 = {
        "query": "rice",
        "pageSize": 1,
        "dataType": "Branded,Foundation,SR Legacy,Survey (FNDDS)",
        "api_key": api_key,
    }
    
    # Test 3: query with parentheses
    params3 = {
        "query": "1.0 cup Mixed greens (lettuce)",
        "pageSize": 1,
        "dataType": "Branded,Foundation,SR Legacy,Survey (FNDDS)",
        "api_key": api_key,
    }

    async with httpx.AsyncClient() as client:
        print("Test 1 (array):")
        resp1 = await client.get(url, params=params1)
        print(resp1.status_code, resp1.text[:200])
        
        print("\nTest 2 (comma-separated):")
        resp2 = await client.get(url, params=params2)
        print(resp2.status_code, resp2.text[:200])
        
        print("\nTest 3 (parentheses):")
        resp3 = await client.get(url, params=params3)
        print(resp3.status_code, resp3.text[:200])

asyncio.run(main())
