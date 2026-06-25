#!/usr/bin/env python3
"""
DMForge Backend API Test Suite
Tests all endpoints at https://insight-forge-172.preview.emergentagent.com/api
CRITICAL: App is in STRIPE LIVE mode - DO NOT complete actual checkouts
"""

import requests
import json
import sys

BASE_URL = "https://insight-forge-172.preview.emergentagent.com/api"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")

def test_health():
    """Test GET /api/ - health check"""
    try:
        resp = requests.get(f"{BASE_URL}/", timeout=10)
        data = resp.json()
        
        # Check CORS headers
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        passed = (
            resp.status_code == 200 and
            data.get('ok') == True and
            data.get('app') == 'DMForge' and
            cors_ok
        )
        
        details = f"Status: {resp.status_code}, Response: {data}, CORS: {cors_ok}"
        print_test("Health Check (GET /api/)", passed, details)
        return passed
    except Exception as e:
        print_test("Health Check (GET /api/)", False, f"Exception: {str(e)}")
        return False

def test_agent_create_happy():
    """Test POST /api/agent/create - happy path"""
    try:
        payload = {
            "niche": "fitness coaching",
            "offer": "12-week body transformation program",
            "audience": "busy professionals 30-45",
            "qualification": "goal, budget, commitment level",
            "tone": "warm, motivating, direct",
            "agentName": "Coach Mike"
        }
        
        resp = requests.post(f"{BASE_URL}/agent/create", json=payload, timeout=30)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        # Validate response structure
        has_id = 'id' in data and isinstance(data['id'], str) and len(data['id']) > 0
        has_script = 'script' in data and isinstance(data['script'], dict)
        has_intro = has_script and 'intro' in data['script'] and len(data['script']['intro']) > 10
        has_questions = has_script and 'questions' in data['script'] and isinstance(data['script']['questions'], list)
        questions_valid = has_questions and len(data['script']['questions']) >= 4 and len(data['script']['questions']) <= 6
        has_booking = has_script and 'bookingMessage' in data['script']
        has_tone = has_script and 'tonePrompt' in data['script']
        has_disqualify = has_script and 'disqualifyResponse' in data['script']
        has_calendar = 'calendarSlots' in data and isinstance(data['calendarSlots'], list)
        has_agent_name = 'agentName' in data and data['agentName'] == 'Coach Mike'
        
        passed = (
            resp.status_code == 200 and
            cors_ok and
            has_id and
            has_intro and
            questions_valid and
            has_booking and
            has_tone and
            has_disqualify and
            has_calendar and
            has_agent_name
        )
        
        details = f"Status: {resp.status_code}, ID: {data.get('id', 'N/A')[:8]}..., Questions: {len(data.get('script', {}).get('questions', []))}, CORS: {cors_ok}"
        print_test("Agent Create - Happy Path", passed, details)
        
        # Return agent ID for subsequent tests
        return passed, data.get('id') if passed else None
    except Exception as e:
        print_test("Agent Create - Happy Path", False, f"Exception: {str(e)}")
        return False, None

def test_agent_create_missing_fields():
    """Test POST /api/agent/create - missing required fields"""
    try:
        # Missing 'offer'
        payload = {"niche": "fitness coaching"}
        resp = requests.post(f"{BASE_URL}/agent/create", json=payload, timeout=10)
        data = resp.json()
        
        passed = resp.status_code == 400 and 'error' in data
        details = f"Status: {resp.status_code}, Error: {data.get('error', 'N/A')}"
        print_test("Agent Create - Missing Fields (400)", passed, details)
        return passed
    except Exception as e:
        print_test("Agent Create - Missing Fields (400)", False, f"Exception: {str(e)}")
        return False

def test_agent_chat_empty_messages(agent_id):
    """Test POST /api/agent/chat - empty messages returns intro"""
    if not agent_id:
        print_test("Agent Chat - Empty Messages", False, "No agent_id available")
        return False
    
    try:
        payload = {"agentId": agent_id, "messages": []}
        resp = requests.post(f"{BASE_URL}/agent/chat", json=payload, timeout=15)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_reply = 'reply' in data and isinstance(data['reply'], str) and len(data['reply']) > 5
        has_state = 'state' in data and isinstance(data['state'], dict)
        state_valid = has_state and data['state'].get('step') == 0 and data['state'].get('qualified') == False
        
        passed = resp.status_code == 200 and cors_ok and has_reply and state_valid
        details = f"Status: {resp.status_code}, Reply length: {len(data.get('reply', ''))}, State: {data.get('state', {})}, CORS: {cors_ok}"
        print_test("Agent Chat - Empty Messages (Intro)", passed, details)
        return passed
    except Exception as e:
        print_test("Agent Chat - Empty Messages (Intro)", False, f"Exception: {str(e)}")
        return False

def test_agent_chat_with_messages(agent_id):
    """Test POST /api/agent/chat - multi-turn conversation"""
    if not agent_id:
        print_test("Agent Chat - With Messages", False, "No agent_id available")
        return False
    
    try:
        # First get intro
        payload1 = {"agentId": agent_id, "messages": []}
        resp1 = requests.post(f"{BASE_URL}/agent/chat", json=payload1, timeout=15)
        data1 = resp1.json()
        intro = data1.get('reply', '')
        
        # Now send a user reply
        payload2 = {
            "agentId": agent_id,
            "messages": [
                {"role": "assistant", "content": intro},
                {"role": "user", "content": "Hey! I'm interested in getting fit"}
            ]
        }
        resp2 = requests.post(f"{BASE_URL}/agent/chat", json=payload2, timeout=20)
        data2 = resp2.json()
        
        # Check CORS
        cors_ok = resp2.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_reply = 'reply' in data2 and isinstance(data2['reply'], str) and len(data2['reply']) > 5
        has_state = 'state' in data2 and isinstance(data2['state'], dict)
        reply_different = has_reply and data2['reply'] != intro
        
        passed = resp2.status_code == 200 and cors_ok and has_reply and has_state and reply_different
        details = f"Status: {resp2.status_code}, Reply length: {len(data2.get('reply', ''))}, State: {data2.get('state', {})}, CORS: {cors_ok}"
        print_test("Agent Chat - Multi-turn Conversation", passed, details)
        return passed
    except Exception as e:
        print_test("Agent Chat - Multi-turn Conversation", False, f"Exception: {str(e)}")
        return False

def test_agent_chat_invalid_id():
    """Test POST /api/agent/chat - invalid agentId returns 404"""
    try:
        payload = {"agentId": "invalid-id-12345", "messages": []}
        resp = requests.post(f"{BASE_URL}/agent/chat", json=payload, timeout=10)
        data = resp.json()
        
        passed = resp.status_code == 404 and 'error' in data
        details = f"Status: {resp.status_code}, Error: {data.get('error', 'N/A')}"
        print_test("Agent Chat - Invalid ID (404)", passed, details)
        return passed
    except Exception as e:
        print_test("Agent Chat - Invalid ID (404)", False, f"Exception: {str(e)}")
        return False

def test_result_save(agent_id):
    """Test POST /api/result/save"""
    if not agent_id:
        print_test("Result Save", False, "No agent_id available")
        return False, None
    
    try:
        payload = {
            "agentId": agent_id,
            "transcript": [
                {"role": "assistant", "content": "hey! thanks for reaching out"},
                {"role": "user", "content": "I want to get fit"},
                {"role": "assistant", "content": "awesome! what's your main goal?"}
            ],
            "state": {"step": 1, "qualified": False, "booked": False, "bookedSlot": None, "tags": []},
            "leadName": "Sarah Johnson"
        }
        
        resp = requests.post(f"{BASE_URL}/result/save", json=payload, timeout=20)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_id = 'id' in data and isinstance(data['id'], str) and len(data['id']) > 0
        has_share_url = 'shareUrl' in data and data['shareUrl'].startswith('/r/')
        
        passed = resp.status_code == 200 and cors_ok and has_id and has_share_url
        details = f"Status: {resp.status_code}, ID: {data.get('id', 'N/A')[:8]}..., ShareURL: {data.get('shareUrl', 'N/A')}, CORS: {cors_ok}"
        print_test("Result Save", passed, details)
        
        return passed, data.get('id') if passed else None
    except Exception as e:
        print_test("Result Save", False, f"Exception: {str(e)}")
        return False, None

def test_result_get(result_id):
    """Test GET /api/result/:id"""
    if not result_id:
        print_test("Result Get", False, "No result_id available")
        return False
    
    try:
        resp = requests.get(f"{BASE_URL}/result/{result_id}", timeout=10)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_id = 'id' in data and data['id'] == result_id
        has_transcript = 'transcript' in data and isinstance(data['transcript'], list)
        has_state = 'state' in data
        has_lead_name = 'leadName' in data
        no_mongo_id = '_id' not in data
        
        passed = resp.status_code == 200 and cors_ok and has_id and has_transcript and has_state and has_lead_name and no_mongo_id
        details = f"Status: {resp.status_code}, ID match: {has_id}, Has transcript: {has_transcript}, No _id: {no_mongo_id}, CORS: {cors_ok}"
        print_test("Result Get", passed, details)
        return passed
    except Exception as e:
        print_test("Result Get", False, f"Exception: {str(e)}")
        return False

def test_competitors():
    """Test GET /api/competitors"""
    try:
        resp = requests.get(f"{BASE_URL}/competitors", timeout=10)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_competitors = 'competitors' in data and isinstance(data['competitors'], list)
        has_12_entries = has_competitors and len(data['competitors']) == 12
        
        passed = resp.status_code == 200 and cors_ok and has_12_entries
        details = f"Status: {resp.status_code}, Count: {len(data.get('competitors', []))}, CORS: {cors_ok}"
        print_test("Competitors List", passed, details)
        return passed
    except Exception as e:
        print_test("Competitors List", False, f"Exception: {str(e)}")
        return False

def test_me_not_found():
    """Test GET /api/me?email=nonexistent"""
    try:
        resp = requests.get(f"{BASE_URL}/me?email=nonexistent@test.com", timeout=10)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        passed = resp.status_code == 200 and cors_ok and data.get('user') is None
        details = f"Status: {resp.status_code}, User: {data.get('user')}, CORS: {cors_ok}"
        print_test("Me - Not Found", passed, details)
        return passed
    except Exception as e:
        print_test("Me - Not Found", False, f"Exception: {str(e)}")
        return False

def test_plans():
    """Test GET /api/plans"""
    try:
        resp = requests.get(f"{BASE_URL}/plans", timeout=10)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_plans = 'plans' in data and isinstance(data['plans'], dict)
        has_pro_monthly = has_plans and 'pro_monthly' in data['plans']
        has_pro_annual = has_plans and 'pro_annual' in data['plans']
        has_agency = has_plans and 'agency' in data['plans']
        
        passed = resp.status_code == 200 and cors_ok and has_pro_monthly and has_pro_annual and has_agency
        details = f"Status: {resp.status_code}, Plans: {list(data.get('plans', {}).keys())}, CORS: {cors_ok}"
        print_test("Plans List", passed, details)
        return passed
    except Exception as e:
        print_test("Plans List", False, f"Exception: {str(e)}")
        return False

def test_billing_checkout_pro_monthly():
    """Test POST /api/billing/checkout - pro_monthly plan"""
    try:
        payload = {
            "email": "test.user.pro.monthly@dmforge-test.com",
            "planKey": "pro_monthly"
        }
        
        resp = requests.post(f"{BASE_URL}/billing/checkout", json=payload, timeout=15)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_url = 'url' in data and isinstance(data['url'], str)
        url_valid = has_url and data['url'].startswith('https://checkout.stripe.com/')
        has_id = 'id' in data and isinstance(data['id'], str)
        
        passed = resp.status_code == 200 and cors_ok and url_valid and has_id
        details = f"Status: {resp.status_code}, URL valid: {url_valid}, Has ID: {has_id}, CORS: {cors_ok}"
        print_test("Billing Checkout - pro_monthly (LIVE MODE - DO NOT COMPLETE)", passed, details)
        return passed
    except Exception as e:
        print_test("Billing Checkout - pro_monthly", False, f"Exception: {str(e)}")
        return False

def test_billing_checkout_pro_annual():
    """Test POST /api/billing/checkout - pro_annual plan"""
    try:
        payload = {
            "email": "test.user.pro.annual@dmforge-test.com",
            "planKey": "pro_annual"
        }
        
        resp = requests.post(f"{BASE_URL}/billing/checkout", json=payload, timeout=15)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_url = 'url' in data and isinstance(data['url'], str)
        url_valid = has_url and data['url'].startswith('https://checkout.stripe.com/')
        has_id = 'id' in data and isinstance(data['id'], str)
        
        passed = resp.status_code == 200 and cors_ok and url_valid and has_id
        details = f"Status: {resp.status_code}, URL valid: {url_valid}, Has ID: {has_id}, CORS: {cors_ok}"
        print_test("Billing Checkout - pro_annual (LIVE MODE - DO NOT COMPLETE)", passed, details)
        return passed
    except Exception as e:
        print_test("Billing Checkout - pro_annual", False, f"Exception: {str(e)}")
        return False

def test_billing_checkout_agency():
    """Test POST /api/billing/checkout - agency plan"""
    try:
        payload = {
            "email": "test.user.agency@dmforge-test.com",
            "planKey": "agency"
        }
        
        resp = requests.post(f"{BASE_URL}/billing/checkout", json=payload, timeout=15)
        data = resp.json()
        
        # Check CORS
        cors_ok = resp.headers.get('Access-Control-Allow-Origin') == '*'
        
        has_url = 'url' in data and isinstance(data['url'], str)
        url_valid = has_url and data['url'].startswith('https://checkout.stripe.com/')
        has_id = 'id' in data and isinstance(data['id'], str)
        
        passed = resp.status_code == 200 and cors_ok and url_valid and has_id
        details = f"Status: {resp.status_code}, URL valid: {url_valid}, Has ID: {has_id}, CORS: {cors_ok}"
        print_test("Billing Checkout - agency (LIVE MODE - DO NOT COMPLETE)", passed, details)
        return passed
    except Exception as e:
        print_test("Billing Checkout - agency", False, f"Exception: {str(e)}")
        return False

def test_billing_checkout_missing_fields():
    """Test POST /api/billing/checkout - missing fields"""
    try:
        payload = {"email": "test@test.com"}  # Missing planKey
        resp = requests.post(f"{BASE_URL}/billing/checkout", json=payload, timeout=10)
        data = resp.json()
        
        passed = resp.status_code == 400 and 'error' in data
        details = f"Status: {resp.status_code}, Error: {data.get('error', 'N/A')}"
        print_test("Billing Checkout - Missing Fields (400)", passed, details)
        return passed
    except Exception as e:
        print_test("Billing Checkout - Missing Fields (400)", False, f"Exception: {str(e)}")
        return False

def test_billing_checkout_invalid_plan():
    """Test POST /api/billing/checkout - invalid planKey"""
    try:
        payload = {"email": "test@test.com", "planKey": "invalid_plan"}
        resp = requests.post(f"{BASE_URL}/billing/checkout", json=payload, timeout=10)
        data = resp.json()
        
        passed = resp.status_code == 400 and 'error' in data
        details = f"Status: {resp.status_code}, Error: {data.get('error', 'N/A')}"
        print_test("Billing Checkout - Invalid Plan (400)", passed, details)
        return passed
    except Exception as e:
        print_test("Billing Checkout - Invalid Plan (400)", False, f"Exception: {str(e)}")
        return False

def test_billing_portal_no_customer():
    """Test POST /api/billing/portal - no customer (404)"""
    try:
        payload = {"email": "nonexistent.customer@dmforge-test.com"}
        resp = requests.post(f"{BASE_URL}/billing/portal", json=payload, timeout=10)
        data = resp.json()
        
        passed = resp.status_code == 404 and 'error' in data
        details = f"Status: {resp.status_code}, Error: {data.get('error', 'N/A')}"
        print_test("Billing Portal - No Customer (404)", passed, details)
        return passed
    except Exception as e:
        print_test("Billing Portal - No Customer (404)", False, f"Exception: {str(e)}")
        return False

def test_stripe_webhook():
    """Test POST /api/stripe/webhook - unsigned payload (dev fallback)"""
    try:
        # Send a test event without signature
        payload = {
            "type": "test.event",
            "data": {"object": {"id": "test_123"}}
        }
        
        resp = requests.post(
            f"{BASE_URL.replace('/api', '')}/api/stripe/webhook",
            json=payload,
            timeout=10
        )
        data = resp.json()
        
        passed = resp.status_code == 200 and data.get('received') == True
        details = f"Status: {resp.status_code}, Response: {data}"
        print_test("Stripe Webhook - Unsigned Payload", passed, details)
        return passed
    except Exception as e:
        print_test("Stripe Webhook - Unsigned Payload", False, f"Exception: {str(e)}")
        return False

def main():
    print("=" * 80)
    print("DMForge Backend API Test Suite")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print("⚠️  WARNING: App is in STRIPE LIVE MODE - DO NOT complete checkouts!")
    print("=" * 80)
    
    results = []
    
    # 1. Health check
    results.append(test_health())
    
    # 2. Agent create - happy path
    agent_create_passed, agent_id = test_agent_create_happy()
    results.append(agent_create_passed)
    
    # 3. Agent create - missing fields
    results.append(test_agent_create_missing_fields())
    
    # 4. Agent chat - empty messages
    results.append(test_agent_chat_empty_messages(agent_id))
    
    # 5. Agent chat - with messages
    results.append(test_agent_chat_with_messages(agent_id))
    
    # 6. Agent chat - invalid ID
    results.append(test_agent_chat_invalid_id())
    
    # 7. Result save
    result_save_passed, result_id = test_result_save(agent_id)
    results.append(result_save_passed)
    
    # 8. Result get
    results.append(test_result_get(result_id))
    
    # 9. Competitors
    results.append(test_competitors())
    
    # 10. Me - not found
    results.append(test_me_not_found())
    
    # 11. Plans
    results.append(test_plans())
    
    # 12. Billing checkout - pro_monthly
    results.append(test_billing_checkout_pro_monthly())
    
    # 13. Billing checkout - pro_annual
    results.append(test_billing_checkout_pro_annual())
    
    # 14. Billing checkout - agency
    results.append(test_billing_checkout_agency())
    
    # 15. Billing checkout - missing fields
    results.append(test_billing_checkout_missing_fields())
    
    # 16. Billing checkout - invalid plan
    results.append(test_billing_checkout_invalid_plan())
    
    # 17. Billing portal - no customer
    results.append(test_billing_portal_no_customer())
    
    # 18. Stripe webhook
    results.append(test_stripe_webhook())
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
