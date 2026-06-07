package com.compta.client.repository;

import com.compta.common.Contact;
import com.compta.common.ContactRepository;
import org.springframework.stereotype.Repository;

/**
 * Client-scoped view of the unified {@code contacts} table.
 * All queries are inherited from {@link ContactRepository}.
 */
@Repository
public interface ClientContactRepository extends ContactRepository {
}
